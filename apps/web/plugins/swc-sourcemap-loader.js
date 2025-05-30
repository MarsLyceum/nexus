// plugins/swc-sourcemap-loader.js
const path = require('path');

// keep track of which map names we've already emitted
const emittedMaps = new Set();

module.exports = function swcSourcemapLoader(source, inputSourceMap) {
    const callback = this.async();
    const filename = this.resourcePath;

    if (!/\.[jt]sx?$/.test(filename) || filename.includes('node_modules')) {
        // not a user TS/JS file → pass through
        return callback(null, source, inputSourceMap);
    }

    // e.g. normalize "src/app/login/page.tsx" → "src/app/login/page.js.map"
    const relPath = path.relative(process.cwd(), filename).replace(/\\/g, '/');
    const mapName = relPath.replace(/\.[jt]sx?$/, '.js.map');

    if (inputSourceMap) {
        if (!emittedMaps.has(mapName)) {
            // emit on disk once
            this.emitFile(mapName, JSON.stringify(inputSourceMap, null, 2));
            emittedMaps.add(mapName);
            console.log(`[swc-sourcemap-loader] Emitted map → ${mapName}`);
        } else {
            console.log(
                `[swc-sourcemap-loader] Skipping duplicate emit for → ${mapName}`
            );
        }
    } else {
        console.warn(
            `[swc-sourcemap-loader] no incoming sourceMap for ${relPath}`
        );
    }

    // pass code & map through unchanged
    callback(null, source, inputSourceMap);
};
