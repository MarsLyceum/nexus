struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VertexOutput {
    let positions = array<vec2<f32>, 4>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, 1.0)
    );
    let p = positions[vi];
    var output: VertexOutput;
    output.position = vec4<f32>(p, 0.0, 1.0);
    output.uv = (p + vec2<f32>(1.0, 1.0)) * 0.5;
    return output;
}

struct GlowUniforms {
    time: f32,
    opacity: f32,
    widthPx: f32,
    heightPx: f32,
    radiusPx: f32,
    padPx: f32,
    shadowOpacity: f32,
    brightness: f32,
    color: vec3<f32>,
    rimBoost: f32,
    focal: vec2<f32>,
    rimSpreadPx: f32,
    noiseMix: f32,
};

struct GlowUniformBuffer {
    timelineAndScale: vec4<f32>,
    layoutAndShadow: vec4<f32>,
    colorAndRim: vec4<f32>,
    focalAndParams: vec4<f32>,
};

@group(0) @binding(0) var<uniform> U: GlowUniformBuffer;

fn loadUniforms() -> GlowUniforms {
    let timeline = U.timelineAndScale;
    let layoutBlock = U.layoutAndShadow;
    let color = U.colorAndRim;
    let focal = U.focalAndParams;
    return GlowUniforms(
        timeline.x,
        timeline.y,
        timeline.z,
        timeline.w,
        layoutBlock.x,
        layoutBlock.y,
        layoutBlock.z,
        layoutBlock.w,
        color.xyz,
        color.w,
        focal.xy,
        focal.z,
        focal.w
    );
}

fn gaussian(r: f32, sigma: f32) -> f32 { return exp(-0.5 * (r * r) / (sigma * sigma)); }
fn hash(p: vec2<f32>) -> f32 { let h = dot(p, vec2<f32>(127.1, 311.7)); return fract(sin(h) * 43758.5453); }
fn saturate(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }

// Signed distance to a rounded rectangle centered at 0 with half-extents b and corner radius r
fn sdRoundedRect(p: vec2<f32>, b: vec2<f32>, r: f32) -> f32 {
    let q = abs(p) - (b - vec2<f32>(r, r));
    return length(max(q, vec2<f32>(0.0, 0.0))) - r;
}

@fragment
fn fs(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
    let uniforms = loadUniforms();
    let time = uniforms.time;
    let opacity = uniforms.opacity;
    let widthPx = uniforms.widthPx;
    let heightPx = uniforms.heightPx;
    let radiusPx = uniforms.radiusPx;
    let padPx = uniforms.padPx;
    let shadowOpacity = uniforms.shadowOpacity;
    let brightness = uniforms.brightness;
    let color = uniforms.color;
    let rimBoost = uniforms.rimBoost;
    let focal = uniforms.focal;
    let rimSpreadPx = uniforms.rimSpreadPx;
    let noiseMix = uniforms.noiseMix;

  // Convert to pixel space centered at 0
    let p = (uv - vec2<f32>(0.5, 0.5)) * vec2<f32>(widthPx, heightPx);

  // Half-extents of inner rectangle (the card shell) in px, subtract padding so glow sits outside
    let half = vec2<f32>(widthPx * 0.5 - padPx, heightPx * 0.5 - padPx);
    let outerHalf = half + vec2<f32>(padPx, padPx);

  // Distance outside the rounded rect. Negative inside, positive outside
    let d = sdRoundedRect(p, half, radiusPx);
    if d < 0.0 {
        return vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }
    let outside = d;

  // Multi-lobe gaussian falloff measured from the edge
    let t1 = gaussian(outside, 18.0);
    let t2 = gaussian(outside, 36.0);
    let t3 = gaussian(outside, 64.0);

  // Animate intensity driven directly by css shadow opacity track
    let intensity = shadowOpacity;

    let softness = max(12.0, padPx * 0.35);
    let nearEdge = 1.0 - smoothstep(0.0, softness, outside);
    let outerDistance = sdRoundedRect(p, outerHalf, radiusPx + padPx);
    let outerMask = 1.0 - smoothstep(-softness, softness * 0.6, outerDistance);
    let distanceFalloff = exp(-outside / max(36.0, padPx * 0.9));
    let mask = saturate(nearEdge * outerMask * distanceFalloff);
    let haloWeights = vec3<f32>(1.1, 0.7, 0.35);
    let halo = dot(haloWeights, vec3<f32>(t3, t2, t1)) / (haloWeights.x + haloWeights.y + haloWeights.z);
    let rimWidth = max(4.0, rimSpreadPx);
    let rim = pow(saturate(1.0 - outside / rimWidth), rimBoost);
    let focusPx = (focal - vec2<f32>(0.5, 0.5)) * vec2<f32>(widthPx, heightPx);
    let focusWeight = saturate(exp(-length(p - focusPx) / (rimWidth * 1.1)));

    var g = intensity * mask * mix(halo, rim, focusWeight);

    // Reduce banding with tiny noise modulated by glow strength to avoid flat tint
    let noiseAmp = noiseMix / 255.0;
    let n = (hash(uv * 1024.0 + vec2<f32>(time, time)) - 0.5) * noiseAmp;
    g = max(0.0, g + n * saturate(g * 8.0));

    let colorScale = g * opacity;
    let c = color * (colorScale * brightness);
    return vec4<f32>(c, saturate(colorScale));
}
