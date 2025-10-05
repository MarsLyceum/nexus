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
import {
    EffectDescriptor,
    createShaderBackends,
    resolveShaderSource,
} from '../../engine';
import { clamp01 } from '../../utils/math';
import { parseHexColor, normalizeRgb, RgbColor } from '../../utils/colors';

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

const DEFAULT_STATE: GlowState = {
    width: 0,
    height: 0,
    dpr: 1,
    borderRadius: 0,
    opacity: 1,
    color: '#ffffff',
    focal: { x: 0.5, y: 0.5 },
    animate: true,
};

const computeGlowUniforms = (
    state: GlowState,
    time: number
): GlowUniformData => {
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
};

const glowUniformsToFloatArray = (uniforms: GlowUniformData): Float32Array =>
    new Float32Array([
        uniforms.timeSeconds,
        uniforms.effectiveOpacity,
        uniforms.widthPx,
        uniforms.heightPx,
        uniforms.radiusPx,
        uniforms.padPx,
        uniforms.shadowOpacity,
        uniforms.brightness,
        uniforms.color.r,
        uniforms.color.g,
        uniforms.color.b,
        uniforms.rimBoost,
        uniforms.focal.x,
        uniforms.focal.y,
        uniforms.rimSpreadPx,
        uniforms.noiseMix,
    ]);

const WEBGL_VERTEX_SHADER_SOURCE = resolveShaderSource(GlowWebGLVertexShader);

const WEBGL_FRAGMENT_SHADER_SOURCE = resolveShaderSource(
    GlowWebGLFragmentShader
);

type WebGLUniformLocations = {
    time: WebGLUniformLocation | null;
    opacity: WebGLUniformLocation | null;
    widthPx: WebGLUniformLocation | null;
    heightPx: WebGLUniformLocation | null;
    radiusPx: WebGLUniformLocation | null;
    padPx: WebGLUniformLocation | null;
    shadowOpacity: WebGLUniformLocation | null;
    brightness: WebGLUniformLocation | null;
    color: WebGLUniformLocation | null;
    rimBoost: WebGLUniformLocation | null;
    focal: WebGLUniformLocation | null;
    rimSpreadPx: WebGLUniformLocation | null;
    noiseMix: WebGLUniformLocation | null;
};

const createGlowWebGLUniformEncoder = () => {
    const locationCache = new WeakMap<WebGLProgram, WebGLUniformLocations>();
    return (
        gl: WebGLRenderingContext | WebGL2RenderingContext,
        program: WebGLProgram,
        uniforms: GlowUniformData
    ) => {
        let uniformLocations = locationCache.get(program);
        if (!uniformLocations) {
            uniformLocations = {
                time: gl.getUniformLocation(program, 'uTime'),
                opacity: gl.getUniformLocation(program, 'uOpacity'),
                widthPx: gl.getUniformLocation(program, 'uWidthPx'),
                heightPx: gl.getUniformLocation(program, 'uHeightPx'),
                radiusPx: gl.getUniformLocation(program, 'uRadiusPx'),
                padPx: gl.getUniformLocation(program, 'uPadPx'),
                shadowOpacity: gl.getUniformLocation(program, 'uShadowOpacity'),
                brightness: gl.getUniformLocation(program, 'uBrightness'),
                color: gl.getUniformLocation(program, 'uColor'),
                rimBoost: gl.getUniformLocation(program, 'uRimBoost'),
                focal: gl.getUniformLocation(program, 'uFocal'),
                rimSpreadPx: gl.getUniformLocation(program, 'uRimSpreadPx'),
                noiseMix: gl.getUniformLocation(program, 'uNoiseMix'),
            };
            locationCache.set(program, uniformLocations);
        }
        uploadGlowUniforms(gl, uniformLocations, uniforms);
    };
};

const uploadGlowUniforms = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    locations: WebGLUniformLocations,
    uniforms: GlowUniformData
) => {
    if (locations.time) gl.uniform1f(locations.time, uniforms.timeSeconds);
    if (locations.opacity)
        gl.uniform1f(locations.opacity, uniforms.effectiveOpacity);
    if (locations.widthPx) gl.uniform1f(locations.widthPx, uniforms.widthPx);
    if (locations.heightPx) gl.uniform1f(locations.heightPx, uniforms.heightPx);
    if (locations.radiusPx) gl.uniform1f(locations.radiusPx, uniforms.radiusPx);
    if (locations.padPx) gl.uniform1f(locations.padPx, uniforms.padPx);
    if (locations.shadowOpacity)
        gl.uniform1f(locations.shadowOpacity, uniforms.shadowOpacity);
    if (locations.brightness)
        gl.uniform1f(locations.brightness, uniforms.brightness);
    if (locations.color)
        gl.uniform3f(
            locations.color,
            uniforms.color.r,
            uniforms.color.g,
            uniforms.color.b
        );
    if (locations.rimBoost) gl.uniform1f(locations.rimBoost, uniforms.rimBoost);
    if (locations.focal)
        gl.uniform2f(locations.focal, uniforms.focal.x, uniforms.focal.y);
    if (locations.rimSpreadPx)
        gl.uniform1f(locations.rimSpreadPx, uniforms.rimSpreadPx);
    if (locations.noiseMix) gl.uniform1f(locations.noiseMix, uniforms.noiseMix);
};

const UNIFORM_BUFFER_SIZE_BYTES = Float32Array.BYTES_PER_ELEMENT * 16;

const createGlowBackends = () =>
    createShaderBackends<GlowUniformData>({
        webgpu: {
            shaderSource: resolveShaderSource(GlowShader),
            entryPoints: {
                vertex: 'vs',
                fragment: 'fs',
            },
            uniformEncoder: {
                encodeUniforms: glowUniformsToFloatArray,
                uniformBufferSize: UNIFORM_BUFFER_SIZE_BYTES,
            },
            debug: {
                enabled: true,
                invocationCapacity: 8192,
            },
        },
        webgl: {
            vertexShaderSource: WEBGL_VERTEX_SHADER_SOURCE,
            fragmentShaderSource: WEBGL_FRAGMENT_SHADER_SOURCE,
            uniformEncoder: createGlowWebGLUniformEncoder(),
        },
    });
export const glowEffectDescriptor: EffectDescriptor<
    GlowState,
    GlowUniformData
> = {
    id: 'glow',
    displayName: 'Glow Effect',
    description: 'Animated glow effect with customizable color and intensity',
    initialState: DEFAULT_STATE,
    metrics: (state) => ({
        width: state.width,
        height: state.height,
        dpr: state.dpr,
    }),
    computeUniforms: ({ state, time }) => computeGlowUniforms(state, time),
    createBackends: createGlowBackends,
    backendPreference: ['webgpu', 'webgl'],
};

export const clampFocal = (focal: { x: number; y: number }) => ({
    x: clamp01(focal.x),
    y: clamp01(focal.y),
});

export { WEBGPU_GLOW_OUTER_PAD_PX } from './glowSpec';
export { hasWebGL, hasWebGPU } from '../../engine/shaderBackends';
