export { Glow } from './Glow';
export type {
    GlowProps,
    GlowBackend,
    GlowDiagnostics,
    GlowStatus,
} from './Glow';
export { glowEffectDescriptor } from './glowConfig';
export type { GlowState, GlowUniformData } from './glowConfig';
export {
    WEBGPU_GLOW_OUTER_PAD_PX,
    GLOW_RIM_BOOST,
    GLOW_RIM_SPREAD,
    GLOW_RIM_WIDTH_SCALE,
    GLOW_NOISE_MIX,
    GLOW_INTENSITY_SCALE,
} from './glowSpec';
export { clampFocal } from '../../utils/geometry';
export { hasWebGL, hasWebGPU } from '../../engine';
