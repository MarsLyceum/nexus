import React from 'react';

export const Canvas = ({ children, style, ...props }) => {
    return React.createElement('div', {
        style: { ...style, position: 'relative' },
        'data-skia-canvas': true,
        ...props,
    });
};

export const Group = ({ children, ...props }) => children;
export const Path = () => null;
export const Circle = () => null;
export const Rect = () => null;
export const RoundedRect = () => null;
export const Line = () => null;
export const Image = () => null;
export const Text = () => null;
export const Svg = () => null;

export const useFont = () => null;
export const useImage = () => null;
export const useSVG = () => null;

export const Skia = {
    Paint: () => ({}),
    Path: {
        Make: () => ({}),
        MakeFromSVGString: () => ({}),
    },
    Color: () => 0,
};

export const AlphaType = {
    Unknown: 0,
    Opaque: 1,
    Premul: 2,
    Unpremul: 3,
};

export const ColorType = {
    Unknown: 0,
    Alpha8: 1,
    RGB565: 2,
    RGBA8888: 3,
    BGRA8888: 4,
};

export const useClock = () => ({ value: 0 });

export default {
    Canvas,
    Group,
    Path,
    Circle,
    Rect,
    RoundedRect,
    Line,
    Image,
    Text,
    Svg,
    useFont,
    useImage,
    useSVG,
    Skia,
    AlphaType,
    ColorType,
    useClock,
};
