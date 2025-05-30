// plugins/ServerSourceMapPlugin.js
const fs = require('fs');
const path = require('path');
const { SourceMapGenerator, SourceMapConsumer } = require('source-map');

module.exports = class ServerSourceMapPlugin {
    constructor(options = {}) {
        this.options = options;
        // track which maps & JS files we've already emitted/updated
        this.emittedMaps = new Set();
        this.updatedJs = new Set();
    }

    apply(compiler) {
        console.log('[ServerSourceMapPlugin] registered');

        // 1) Patch SWC loader to emit per-module maps
        compiler.hooks.normalModuleFactory.tap(
            'ServerSourceMapPlugin',
            (factory) => {
                factory.hooks.afterResolve.tap(
                    'ServerSourceMapPlugin',
                    (data) => {
                        if (!data.loaders) return;
                        for (const loader of data.loaders) {
                            if (loader.loader?.toLowerCase().includes('swc')) {
                                loader.options = {
                                    ...loader.options,
                                    swcOptions: {
                                        ...loader.options.swcOptions,
                                        sourceMaps: true,
                                        inlineSourcesContent: true,
                                    },
                                };
                                console.log(
                                    '[ServerSourceMapPlugin] enabled SWC sourceMaps for',
                                    loader.loader
                                );
                            }
                        }
                    }
                );
            }
        );

        // 2) Merge per-module maps into per-chunk maps
        compiler.hooks.thisCompilation.tap(
            'ServerSourceMapPlugin',
            (compilation) => {
                const { RawSource } = compiler.webpack.sources;
                const STAGE =
                    compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT;

                compilation.hooks.processAssets.tapPromise(
                    {
                        name: 'ServerSourceMapPlugin',
                        stage: STAGE,
                    },
                    async () => {
                        const outDir = compilation.outputOptions.path;

                        for (const chunk of compilation.chunks) {
                            for (const file of chunk.files) {
                                if (!file.endsWith('.js')) continue;

                                console.log(
                                    `[ServerSourceMapPlugin] bundling source map for chunk ${file}`
                                );

                                // 2a) Build the combined source-map
                                let lineOffset = 0;
                                const mapGen = new SourceMapGenerator({ file });

                                for (const module of chunk.modulesIterable) {
                                    const orig = module.originalSource?.();
                                    if (!orig?.sourceAndMap) continue;

                                    const { source, map } = orig.sourceAndMap();
                                    const srcText =
                                        typeof source === 'string'
                                            ? source
                                            : Buffer.isBuffer(source)
                                              ? source.toString('utf8')
                                              : String(source);

                                    if (map) {
                                        const consumer =
                                            await new SourceMapConsumer(map);

                                        consumer.eachMapping((m) => {
                                            mapGen.addMapping({
                                                generated: {
                                                    line:
                                                        m.generatedLine +
                                                        lineOffset,
                                                    column: m.generatedColumn,
                                                },
                                                original: {
                                                    line: m.originalLine,
                                                    column: m.originalColumn,
                                                },
                                                source: m.source,
                                                name: m.name,
                                            });
                                        });

                                        for (const src of consumer.sources) {
                                            const content =
                                                consumer.sourceContentFor(
                                                    src,
                                                    true
                                                );
                                            if (content != null) {
                                                mapGen.setSourceContent(
                                                    src,
                                                    content
                                                );
                                            }
                                        }

                                        // ← only destroy if available
                                        if (
                                            typeof consumer.destroy ===
                                            'function'
                                        ) {
                                            consumer.destroy();
                                        }
                                    }

                                    lineOffset += srcText.split('\n').length;
                                }

                                // 2b) Grab the generated JS & the map JSON
                                const jsSource =
                                    compilation.assets[file].source();
                                const mapName = `${file}.map`;
                                const mapJson = mapGen.toString();

                                // 2c) **Update** the .js asset only once
                                if (!this.updatedJs.has(file)) {
                                    compilation.updateAsset(
                                        file,
                                        new RawSource(
                                            jsSource +
                                                `\n//# sourceMappingURL=${path.basename(mapName)}`
                                        )
                                    );
                                    this.updatedJs.add(file);
                                }

                                // 2d) **Emit** the .map only once
                                if (!this.emittedMaps.has(mapName)) {
                                    compilation.emitAsset(
                                        mapName,
                                        new RawSource(mapJson)
                                    );
                                    this.emittedMaps.add(mapName);
                                }

                                // 2e) Also write both to disk (once each)
                                for (const [fname, content] of [
                                    [file, compilation.assets[file].source()],
                                    [mapName, mapJson],
                                ]) {
                                    const shouldWrite =
                                        (fname.endsWith('.js') &&
                                            this.updatedJs.has(fname)) ||
                                        (fname.endsWith('.map') &&
                                            this.emittedMaps.has(fname));

                                    if (!shouldWrite) continue;
                                    const full = path.join(outDir, fname);
                                    try {
                                        fs.mkdirSync(path.dirname(full), {
                                            recursive: true,
                                        });
                                        fs.writeFileSync(full, content, 'utf8');
                                        console.log(
                                            `[ServerSourceMapPlugin] wrote ${full}`
                                        );
                                    } catch (err) {
                                        console.warn(
                                            `[ServerSourceMapPlugin] failed to write ${full}:`,
                                            err
                                        );
                                    }
                                }
                            }
                        }
                    }
                );
            }
        );
    }
};
