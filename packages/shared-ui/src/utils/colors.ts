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
