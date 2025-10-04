'use strict';

const upstreamTransformer = require('metro-babel-transformer');

const stripQuery = (fileName) => fileName.split('?')[0];

const isShaderFile = (fileName) => {
    const normalized = stripQuery(fileName);
    return normalized.endsWith('.wgsl') || normalized.endsWith('.glsl');
};

const normalizeFilename = (fileName) => stripQuery(fileName);

const createVirtualFilename = (fileName) => {
    const normalized = normalizeFilename(fileName);
    return normalized.endsWith('.js') ? normalized : `${normalized}.js`;
};

const toCommonJsModule = (serializedShader) => `"use strict";
const shaderSource = ${serializedShader};
exports.__esModule = true;
exports.default = shaderSource;`;

const transformShader = (props) => {
    const { src, filename } = props;
    const virtualFilename = createVirtualFilename(filename);
    console.log(
        `[metro-shader-transformer] transforming ${filename} -> ${virtualFilename}`
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
    isShaderFile(props.filename)
        ? transformShader(props)
        : upstreamTransformer.transform(props);
