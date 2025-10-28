struct DebugEntry {
    kind: u32,
    x: f32,
    y: f32,
    z: f32,
}

struct DebugBuffer {
    counter: atomic<u32>,
    entries: array<DebugEntry>,
}

@group(1) @binding(0) var<storage, read_write> debug_buffer: DebugBuffer;

const DEBUG_KIND_RADIUS: u32 = 100u;

fn debug_log_f32(value: f32) {
    let idx = atomicAdd(&debug_buffer.counter, 1u);
    if idx < arrayLength(&debug_buffer.entries) {
        debug_buffer.entries[idx] = DebugEntry(1u, value, 0.0, 0.0);
    }
}

fn debug_log_vec2(value: vec2<f32>) {
    let idx = atomicAdd(&debug_buffer.counter, 1u);
    if idx < arrayLength(&debug_buffer.entries) {
        debug_buffer.entries[idx] = DebugEntry(2u, value.x, value.y, 0.0);
    }
}

fn debug_log_vec3(value: vec3<f32>) {
    let idx = atomicAdd(&debug_buffer.counter, 1u);
    if idx < arrayLength(&debug_buffer.entries) {
        debug_buffer.entries[idx] = DebugEntry(3u, value.x, value.y, value.z);
    }
}

fn debug_log_radius(value: f32) {
    let idx = atomicAdd(&debug_buffer.counter, 1u);
    if idx < arrayLength(&debug_buffer.entries) {
        debug_buffer.entries[idx] = DebugEntry(DEBUG_KIND_RADIUS, value, 0.0, 0.0);
    }
}

fn debug_log_u32(value: u32) {
    let idx = atomicAdd(&debug_buffer.counter, 1u);
    if idx < arrayLength(&debug_buffer.entries) {
        debug_buffer.entries[idx] = DebugEntry(4u, bitcast<f32>(value), 0.0, 0.0);
    }
}

fn debug_log_i32(value: i32) {
    let idx = atomicAdd(&debug_buffer.counter, 1u);
    if idx < arrayLength(&debug_buffer.entries) {
        debug_buffer.entries[idx] = DebugEntry(5u, bitcast<f32>(value), 0.0, 0.0);
    }
}

fn debug_log_bool(value: bool) {
    let idx = atomicAdd(&debug_buffer.counter, 1u);
    if idx < arrayLength(&debug_buffer.entries) {
        debug_buffer.entries[idx] = DebugEntry(6u, select(0.0, 1.0, value), 0.0, 0.0);
    }
}
