import GlowShader from './glow.wgsl';
import GlowWebGLVertexShader from './glowWebGL.vert.glsl';
import GlowWebGLFragmentShader from './glowWebGL.frag.glsl';
import {
    getGlowCssValues,
    WEBGPU_GLOW_OUTER_PAD_PX,
    GLOW_RIM_BOOST,
    GLOW_RIM_SPREAD,
    GLOW_RIM_WIDTH_SCALE,
    GLOW_NOISE_MIX,
    GLOW_INTENSITY_SCALE,
} from './glowSpec';
import { defineEffect, type UniformSchema } from '../../engine';
import { clamp01 } from '../../utils/math';
import { parseHexColor, normalizeRgb, type RgbColor } from '../../utils/colors';

export type GlowState = {
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
    readonly borderRadius: number;
    readonly opacity: number;
    readonly color: string;
    readonly focal: { readonly x: number; readonly y: number };
    readonly animate: boolean;
};

export type GlowUniformData = {
    readonly timeSeconds: number;
    readonly effectiveOpacity: number;
    readonly widthPx: number;
    readonly heightPx: number;
    readonly radiusPx: number;
    readonly padPx: number;
    readonly shadowOpacity: number;
    readonly brightness: number;
    readonly color: RgbColor;
    readonly rimBoost: number;
    readonly focal: { readonly x: number; readonly y: number };
    readonly rimSpreadPx: number;
    readonly noiseMix: number;
};

const glowUniformSchema: UniformSchema<GlowUniformData> = [
    { name: 'uTime', type: 'float', accessor: (u) => u.timeSeconds },
    { name: 'uOpacity', type: 'float', accessor: (u) => u.effectiveOpacity },
    { name: 'uWidthPx', type: 'float', accessor: (u) => u.widthPx },
    { name: 'uHeightPx', type: 'float', accessor: (u) => u.heightPx },
    { name: 'uRadiusPx', type: 'float', accessor: (u) => u.radiusPx },
    { name: 'uPadPx', type: 'float', accessor: (u) => u.padPx },
    { name: 'uShadowOpacity', type: 'float', accessor: (u) => u.shadowOpacity },
    { name: 'uBrightness', type: 'float', accessor: (u) => u.brightness },
    {
        name: 'uColor',
        type: 'vec3',
        accessor: (u) => [u.color.r, u.color.g, u.color.b] as const,
    },
    { name: 'uRimBoost', type: 'float', accessor: (u) => u.rimBoost },
    {
        name: 'uFocal',
        type: 'vec2',
        accessor: (u) => [u.focal.x, u.focal.y] as const,
    },
    { name: 'uRimSpreadPx', type: 'float', accessor: (u) => u.rimSpreadPx },
    { name: 'uNoiseMix', type: 'float', accessor: (u) => u.noiseMix },
];

export const glowEffectDescriptor = defineEffect<GlowState, GlowUniformData>({
    id: 'glow',
    displayName: 'Glow Effect',
    description: 'Animated glow effect with customizable color and intensity',
    initialState: {
        width: 0,
        height: 0,
        dpr: 1,
        borderRadius: 0,
        opacity: 1,
        color: '#ffffff',
        focal: { x: 0.5, y: 0.5 },
        animate: true,
    },
    computeUniforms: (state, time) => {
        const timelineTime = state.animate ? time : 0;
        const glowValues = getGlowCssValues(timelineTime);
        const effectiveOpacity =
            state.opacity * GLOW_INTENSITY_SCALE * glowValues.opacity;
        const outerPad = WEBGPU_GLOW_OUTER_PAD_PX;
        const padPx = outerPad * state.dpr;
        const widthPx = Math.max(0, state.width) * state.dpr;
        const heightPx = Math.max(0, state.height) * state.dpr;
        const innerWidthPx = Math.max(0, widthPx - padPx * 2);
        const innerHeightPx = Math.max(0, heightPx - padPx * 2);
        const maxRadiusPx = 0.5 * Math.min(innerWidthPx, innerHeightPx);
        const radiusPx = Math.min(state.borderRadius * state.dpr, maxRadiusPx);
        const rgb = normalizeRgb(parseHexColor(state.color));
        return {
            timeSeconds: timelineTime,
            effectiveOpacity,
            widthPx,
            heightPx,
            radiusPx,
            padPx,
            shadowOpacity: glowValues.shadowOpacity,
            brightness: glowValues.brightness,
            color: rgb,
            rimBoost: GLOW_RIM_BOOST,
            focal: {
                x: clamp01(state.focal.x),
                y: clamp01(state.focal.y),
            },
            rimSpreadPx: GLOW_RIM_SPREAD * GLOW_RIM_WIDTH_SCALE * state.dpr,
            noiseMix: GLOW_NOISE_MIX,
        };
    },
    backends: {
        uniformSchema: glowUniformSchema,
        webgpu: {
            shaderSource: GlowShader,
            entryPoints: {
                vertex: 'vs',
                fragment: 'fs',
            },
        },
        webgl: {
            vertexShader: GlowWebGLVertexShader,
            fragmentShader: GlowWebGLFragmentShader,
        },
    },
});
