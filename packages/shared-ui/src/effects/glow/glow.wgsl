struct VSOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>
};

@vertex
fn vs(@builtin(vertex_index) vi: u32) -> VSOut {
    var positions = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0), vec2<f32>(1.0, -1.0), vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0), vec2<f32>(1.0, -1.0), vec2<f32>(1.0, 1.0)
    );
    let p = positions[vi];
    var out: VSOut;
    out.pos = vec4<f32>(p, 0.0, 1.0);
    out.uv = (p + vec2<f32>(1.0, 1.0)) * 0.5;
    return out;
}

// 64-byte uniform block; keep fields aligned to 16 bytes
struct Uniforms {
    time: f32,             // seconds
    opacity: f32,          // css opacity multiplier * component opacity
    widthPx: f32,          // canvas width in px
    heightPx: f32,         // canvas height in px
    radiusPx: f32,         // corner radius in px
    padPx: f32,            // glow padding outside rect in px
    shadowOpacity: f32,    // css shadow opacity value
    brightness: f32,       // css brightness multiplier
    colorAndRim: vec4<f32>,   // rgb + rim boost
    focalAndParams: vec4<f32>, // focal.xy, haloSpreadPx, noiseMix
};
@group(0) @binding(0) var<uniform> U: Uniforms;

fn gaussian(r: f32, sigma: f32) -> f32 { return exp(-0.5 * (r * r) / (sigma * sigma)); }
fn hash(p: vec2<f32>) -> f32 { let h = dot(p, vec2<f32>(127.1, 311.7)); return fract(sin(h) * 43758.5453); }
fn saturate(x: f32) -> f32 { return clamp(x, 0.0, 1.0); }

// Signed distance to a rounded rectangle centered at 0 with half-extents b and corner radius r
fn sdRoundedRect(p: vec2<f32>, b: vec2<f32>, r: f32) -> f32 {
    let q = abs(p) - (b - vec2<f32>(r, r));
    return length(max(q, vec2<f32>(0.0, 0.0))) - r;
}

@fragment
fn fs(in_: VSOut) -> @location(0) vec4<f32> {
  // Convert to pixel space centered at 0
    let uv = in_.uv;
    let p = (uv - vec2<f32>(0.5, 0.5)) * vec2<f32>(U.widthPx, U.heightPx);

  // Half-extents of inner rectangle (the card shell) in px, subtract padding so glow sits outside
    let half = vec2<f32>(U.widthPx * 0.5 - U.padPx, U.heightPx * 0.5 - U.padPx);
    let outerHalf = half + vec2<f32>(U.padPx, U.padPx);

  // Distance outside the rounded rect. Negative inside, positive outside
    let d = sdRoundedRect(p, half, U.radiusPx);
    if d < 0.0 {
        return vec4<f32>(0.0, 0.0, 0.0, 0.0);
    }
    let outside = d;

  // Multi-lobe gaussian falloff measured from the edge
    let t1 = gaussian(outside, 18.0);
    let t2 = gaussian(outside, 36.0);
    let t3 = gaussian(outside, 64.0);

  // Animate intensity driven directly by css shadow opacity track
    let intensity = U.shadowOpacity;

    let softness = max(12.0, U.padPx * 0.35);
    let nearEdge = 1.0 - smoothstep(0.0, softness, outside);
    let outerDistance = sdRoundedRect(p, outerHalf, U.radiusPx + U.padPx);
    let outerMask = 1.0 - smoothstep(-softness, softness * 0.6, outerDistance);
    let distanceFalloff = exp(-outside / max(36.0, U.padPx * 0.9));
    let mask = saturate(nearEdge * outerMask * distanceFalloff);
    let haloWeights = vec3<f32>(1.1, 0.7, 0.35);
    let halo = dot(haloWeights, vec3<f32>(t3, t2, t1)) / (haloWeights.x + haloWeights.y + haloWeights.z);
    let rimWidth = max(4.0, U.focalAndParams.z);
    let rim = pow(saturate(1.0 - outside / rimWidth), U.colorAndRim.w);
    let focusUv = U.focalAndParams.xy;
    let focusPx = (focusUv - vec2<f32>(0.5, 0.5)) * vec2<f32>(U.widthPx, U.heightPx);
    let focusWeight = saturate(exp(-length(p - focusPx) / (rimWidth * 1.1)));

    var g = intensity * mask * mix(halo, rim, focusWeight);

  // Reduce banding with tiny noise modulated by glow strength to avoid flat tint
    let noiseAmp = U.focalAndParams.w / 255.0;
    let n = (hash(uv * 1024.0 + vec2<f32>(U.time, U.time)) - 0.5) * noiseAmp;
    g = max(0.0, g + n * saturate(g * 8.0));

    let colorScale = g * U.opacity;
    let c = U.colorAndRim.xyz * (colorScale * U.brightness);
    return vec4<f32>(c, saturate(colorScale));
}
