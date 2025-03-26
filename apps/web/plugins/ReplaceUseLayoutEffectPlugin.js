// ReplaceUseLayoutEffectPlugin.js
const { RawSource } = require('webpack-sources');

class ReplaceUseLayoutEffectPlugin {
    apply(compiler) {
        // Hook into the compilation phase
        compiler.hooks.compilation.tap(
            'ReplaceUseLayoutEffectPlugin',
            (compilation) => {
                // Use processAssets hook to modify assets before they are sealed
                compilation.hooks.processAssets.tap(
                    {
                        name: 'ReplaceUseLayoutEffectPlugin',
                        stage: compiler.webpack.Compilation
                            .PROCESS_ASSETS_STAGE_ADDITIONS,
                    },
                    (assets) => {
                        // Iterate over all assets
                        Object.keys(assets).forEach((assetName) => {
                            // Only process JavaScript/TypeScript files
                            if (/\.(js|ts|tsx)$/.test(assetName)) {
                                const asset = compilation.assets[assetName];
                                const source = asset.source();
                                // Replace all occurrences of "useLayoutEffect" with "useEffect"
                                const updatedSource = source.replace(
                                    /useLayoutEffect/g,
                                    'useEffect'
                                );
                                // Update the asset using updateAsset and RawSource
                                compilation.updateAsset(
                                    assetName,
                                    new RawSource(updatedSource)
                                );
                            }
                        });
                    }
                );
            }
        );
    }
}

module.exports = ReplaceUseLayoutEffectPlugin;
