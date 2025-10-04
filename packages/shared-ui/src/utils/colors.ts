export const lerp = (start: number, end: number, amount: number) =>
    start + (end - start) * amount;

export const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const toChannel = (value: number) => clamp(Math.round(value), 0, 255);

export const mixRgb = (
    first: { r: number; g: number; b: number },
    second: { r: number; g: number; b: number },
    amount: number
) => ({
    r: toChannel(lerp(first.r, second.r, amount)),
    g: toChannel(lerp(first.g, second.g, amount)),
    b: toChannel(lerp(first.b, second.b, amount)),
});

const toHex = (channel: number) => channel.toString(16).padStart(2, '0');

export const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
    `#${toHex(toChannel(r))}${toHex(toChannel(g))}${toHex(toChannel(b))}`;

const parseHexChannel = (value: string) => Number.parseInt(value, 16);

export const hexToRgb = (hex: string) => {
    const normalized = hex.startsWith('#') ? hex.slice(1) : hex;
    if (normalized.length !== 6 && normalized.length !== 3) {
        return { r: 0, g: 0, b: 0 };
    }
    if (normalized.length === 3) {
        const [r, g, b] = normalized.split('');
        return {
            r: parseHexChannel(r + r),
            g: parseHexChannel(g + g),
            b: parseHexChannel(b + b),
        };
    }
    return {
        r: parseHexChannel(normalized.slice(0, 2)),
        g: parseHexChannel(normalized.slice(2, 4)),
        b: parseHexChannel(normalized.slice(4, 6)),
    };
};

export const lightenColor = (hex: string, amount: number) =>
    rgbToHex(mixRgb(hexToRgb(hex), { r: 255, g: 255, b: 255 }, amount));

export const darkenColor = (hex: string, amount: number) =>
    rgbToHex(mixRgb(hexToRgb(hex), { r: 0, g: 0, b: 0 }, amount));
/* eslint-disable no-bitwise */

export const toRgba = (hex: string, alpha: number): string => {
    const stripped = hex.replace('#', '');
    const normalized =
        stripped.length === 3
            ? [...stripped].map((char) => char.repeat(2)).join('')
            : stripped.slice(0, 6);
    const bigint = Number.parseInt(normalized, 16);
    if (Number.isNaN(bigint)) {
        return `rgba(255, 255, 255, ${alpha})`;
    }
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
