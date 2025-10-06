import { clamp01 } from './math';

export const clampFocal = (focal: { x: number; y: number }) => ({
    x: clamp01(focal.x),
    y: clamp01(focal.y),
});
