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
    vec2 outerHalf = vec2(uWidthPx * 0.5, uHeightPx * 0.5);
    vec2 innerHalf = max(outerHalf - vec2(uPadPx, uPadPx), vec2(0.0, 0.0));
    vec2 toCenter = vUv - vec2(0.5, 0.5);
    vec2 pOuter = toCenter * (outerHalf * 2.0);
    vec2 paddedHalf = outerHalf + vec2(uPadPx, uPadPx);
    vec2 pWithPad = toCenter * (paddedHalf * 2.0);
    vec2 nearestOnInner = clamp(pOuter, -innerHalf, innerHalf);
    vec2 nearestOnPadded = clamp(pWithPad, -paddedHalf, paddedHalf);

    float distanceFromEdge = sdRoundedRect(pOuter, innerHalf, uRadiusPx);
    if (distanceFromEdge < 0.0) {
        discard;
    }

    float t1 = gaussian(distanceFromEdge, 18.0);
    float t2 = gaussian(distanceFromEdge, 36.0);
    float t3 = gaussian(distanceFromEdge, 64.0);

    float intensity = uShadowOpacity;
    float softness = max(12.0, uPadPx * 0.35);
    float nearEdge = 1.0 - smoothstep(0.0, softness, distanceFromEdge);
    float outerDistance = sdRoundedRect(nearestOnPadded, paddedHalf, uRadiusPx + uPadPx);
    float outerMask = 1.0 - smoothstep(-softness, softness * 0.6, outerDistance);
    float distanceFalloff = exp(-distanceFromEdge / max(36.0, uPadPx * 0.9));
    float mask = saturate(nearEdge * outerMask * distanceFalloff);
    vec3 haloWeights = vec3(1.2, 0.9, 0.55);
    float halo = dot(haloWeights, vec3(t3, t2, t1)) / (haloWeights.x + haloWeights.y + haloWeights.z);
    float rimWidth = max(6.0, uRimSpreadPx * 1.1);
    float rim = pow(saturate(1.0 - distanceFromEdge / rimWidth), uRimBoost);
    vec2 focusPx = (uFocal - vec2(0.5, 0.5)) * innerHalf * 2.0;
    float focusWeight = saturate(exp(-length(nearestOnInner - focusPx) / (rimWidth * 1.1)));
    float glow = intensity * mask * mix(halo, rim, focusWeight);

    float noiseAmplitude = uNoiseMix / 255.0;
    float noise = (hash(vUv * 1024.0 + vec2(uTime, uTime)) - 0.5) * noiseAmplitude;
    glow = max(0.0, glow + noise * saturate(glow * 8.0));

    float colorScale = glow * uOpacity;
    vec3 color = uColor * (colorScale * uBrightness);
    gl_FragColor = vec4(color, saturate(colorScale));
}
