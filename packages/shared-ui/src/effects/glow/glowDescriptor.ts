import GlowShader from './glow.wgsl';
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
    const widthPx = state.width * state.dpr;
    const heightPx = state.height * state.dpr;
    const radiusPx = state.borderRadius * state.dpr;
    const padPx = WEBGPU_GLOW_OUTER_PAD_PX * state.dpr;
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

const WEBGL_VERTEX_SHADER_SOURCE = `
attribute vec2 position;
varying vec2 vUv;

void main() {
    vUv = (position + 1.0) * 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
}
`;

const WEBGL_FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uOpacity;
uniform float uWidthPx;
uniform float uHeightPx;
uniform float uRadiusPx;
uniform float uPadPx;
uniform float uShadowOpacity;
uniform float uBrightness;
uniform vec3 uColor;
uniform float uRimBoost;
uniform vec2 uFocal;
uniform float uRimSpreadPx;
uniform float uNoiseMix;

float gaussian(float r, float sigma) {
    return exp(-0.5 * (r * r) / (sigma * sigma));
}

float hash(vec2 p) {
    float h = dot(p, vec2(127.1, 311.7));
    return fract(sin(h) * 43758.5453);
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

float sdRoundedRect(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - (b - vec2(r, r));
    return length(max(q, vec2(0.0, 0.0))) - r;
}

void main() {
    vec2 p = (vUv - vec2(0.5, 0.5)) * vec2(uWidthPx, uHeightPx);
    vec2 halfSize = vec2(uWidthPx * 0.5 - uPadPx, uHeightPx * 0.5 - uPadPx);
    vec2 outerHalf = halfSize + vec2(uPadPx, uPadPx);

    float distanceFromEdge = sdRoundedRect(p, halfSize, uRadiusPx);
    if (distanceFromEdge < 0.0) {
        discard;
    }

    float t1 = gaussian(distanceFromEdge, 18.0);
    float t2 = gaussian(distanceFromEdge, 36.0);
    float t3 = gaussian(distanceFromEdge, 64.0);

    float intensity = uShadowOpacity;
    float softness = max(12.0, uPadPx * 0.35);
    float nearEdge = 1.0 - smoothstep(0.0, softness, distanceFromEdge);
    float outerDistance = sdRoundedRect(p, outerHalf, uRadiusPx + uPadPx);
    float outerMask = 1.0 - smoothstep(-softness, softness * 0.6, outerDistance);
    float distanceFalloff = exp(-distanceFromEdge / max(36.0, uPadPx * 0.9));
    float mask = saturate(nearEdge * outerMask * distanceFalloff);
    vec3 haloWeights = vec3(1.1, 0.7, 0.35);
    float halo = dot(haloWeights, vec3(t3, t2, t1)) / (haloWeights.x + haloWeights.y + haloWeights.z);
    float rimWidth = max(4.0, uRimSpreadPx);
    float rim = pow(saturate(1.0 - distanceFromEdge / rimWidth), uRimBoost);
    vec2 focusPx = (uFocal - vec2(0.5, 0.5)) * vec2(uWidthPx, uHeightPx);
    float focusWeight = saturate(exp(-length(p - focusPx) / (rimWidth * 1.1)));
    float glow = intensity * mask * mix(halo, rim, focusWeight);

    float noiseAmplitude = uNoiseMix / 255.0;
    float noise = (hash(vUv * 1024.0 + vec2(uTime, uTime)) - 0.5) * noiseAmplitude;
    glow = max(0.0, glow + noise * saturate(glow * 8.0));

    float colorScale = glow * uOpacity;
    vec3 color = uColor * (colorScale * uBrightness);
    gl_FragColor = vec4(color, saturate(colorScale));
}
`;

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

const UNIFORM_BUFFER_SIZE_BYTES = 256;

const createGlowBackends = () =>
    createShaderBackends<GlowUniformData>({
        webgpu: {
            shaderSource: resolveShaderSource(GlowShader),
            uniformEncoder: {
                encodeUniforms: glowUniformsToFloatArray,
                uniformBufferSize: UNIFORM_BUFFER_SIZE_BYTES,
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
