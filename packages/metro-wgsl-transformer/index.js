'use strict';

const upstreamTransformer = require('metro-babel-transformer');

const stripQuery = (fileName) => fileName.split('?')[0];

const isWgslFile = (fileName) => stripQuery(fileName).endsWith('.wgsl');

const normalizeFilename = (fileName) => stripQuery(fileName);

const createVirtualFilename = (fileName) => {
    const normalized = normalizeFilename(fileName);
    return normalized.endsWith('.js') ? normalized : `${normalized}.js`;
};

const toCommonJsModule = (serializedShader) => `"use strict";
(() => {
  const module = { exports: {} };
  const exports = module.exports;
  exports.default = ${serializedShader};
  return module.exports;
})();`;

const transformWgsl = (props) => {
    const { src, filename } = props;
    const virtualFilename = createVirtualFilename(filename);
    console.log(
        `[metro-wgsl-transformer] transforming ${filename} -> ${virtualFilename}`
    );
    const payload = JSON.stringify(String(src));
    const code = toCommonJsModule(payload);
    const commonJsProps = {
        ...props,
        filename: virtualFilename,
        src: code,
    };
    return upstreamTransformer.transform(commonJsProps);
};

module.exports.transform = (props) =>
    isWgslFile(props.filename)
        ? transformWgsl(props)
        : upstreamTransformer.transform(props);
