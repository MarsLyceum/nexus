import DebugShader from './debug.wgsl';
import { resolveShaderSource } from './shaderUtils';

export type WGSLDebugConfig = {
    readonly bindGroupIndex?: number;
    readonly invocationCapacity?: number;
};

export type WGSLDebugHandle = {
    readonly buf: GPUBuffer;
    readonly readbackBuf: GPUBuffer;
    readonly setup: (device: GPUDevice, capacity: number) => Promise<void>;
    readonly isActive: () => boolean;
    readonly addShader: (source: string, autoInject: boolean) => string;
    readonly setBindGroup: (
        pipeline: GPURenderPipeline,
        pass: GPURenderPassEncoder
    ) => void;
    readonly fetch: (encoder: GPUCommandEncoder) => void;
    readonly post: () => Promise<void>;
};

const WGSL_DEBUG_ENTRY_SIZE = 16;

const formatFloat = (v: number): string => v.toFixed(6);

const formatU32 = (v: number): string => {
    const floatView = new Float32Array([v]);
    const intView = new Uint32Array(floatView.buffer);
    return intView[0].toString();
};

const formatI32 = (v: number): string => {
    const floatView = new Float32Array([v]);
    const intView = new Int32Array(floatView.buffer);
    return intView[0].toString();
};

const DEBUG_KIND_RADIUS = 100;

const formatDebugEntry = (
    kind: number,
    x: number,
    y: number,
    z: number
): string => {
    if (kind === DEBUG_KIND_RADIUS) {
        return `radius: ${formatFloat(x)}`;
    }
    switch (kind) {
        case 1: {
            return `f32: ${formatFloat(x)}`;
        }
        case 2: {
            return `vec2: (${formatFloat(x)}, ${formatFloat(y)})`;
        }
        case 3: {
            return `vec3: (${formatFloat(x)}, ${formatFloat(y)}, ${formatFloat(z)})`;
        }
        case 4: {
            return `u32: ${formatU32(x)}`;
        }
        case 5: {
            return `i32: ${formatI32(x)}`;
        }
        case 6: {
            return `bool: ${x !== 0}`;
        }
        default: {
            return `unknown type ${kind}`;
        }
    }
};

const createDebugShaderSource = (bindGroupIndex: number): string =>
    resolveShaderSource(DebugShader).replace(
        '@group(1)',
        `@group(${bindGroupIndex})`
    );

export const createWGSLDebug = (bindGroupIndex = 1): WGSLDebugHandle => {
    let device: GPUDevice | undefined;
    let debugBuffer: GPUBuffer | undefined;
    let readbackBuffer: GPUBuffer | undefined;
    const bindGroups = new WeakMap<GPURenderPipeline, GPUBindGroup>();
    let capacity = 0;
    let active = false;
    let readbackPending = false;
    let mapInFlight = false;
    let lastRadius: number | undefined;

    const setup = (dev: GPUDevice, cap: number): Promise<void> => {
        device = dev;
        capacity = cap;
        const bufferSize = 4 + capacity * WGSL_DEBUG_ENTRY_SIZE;

        debugBuffer = device.createBuffer({
            size: bufferSize,
            usage:
                GPUBufferUsage.STORAGE |
                GPUBufferUsage.COPY_SRC |
                GPUBufferUsage.COPY_DST,
        });

        readbackBuffer = device.createBuffer({
            size: bufferSize,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });

        const bufferData = new Uint32Array(1 + capacity * 4);
        bufferData[0] = 0;
        device.queue.writeBuffer(debugBuffer, 0, bufferData);

        active = true;
        return Promise.resolve();
    };

    const isActive = (): boolean => active;

    const addShader = (source: string, autoInject: boolean): string => {
        if (!autoInject) {
            return source;
        }
        const utilities = createDebugShaderSource(bindGroupIndex);
        return `${utilities}\n${source}`;
    };

    const resolveBindGroup = (
        pipeline: GPURenderPipeline
    ): GPUBindGroup | undefined => {
        if (!device || !debugBuffer) {
            return undefined;
        }
        const existing = bindGroups.get(pipeline);
        if (existing) {
            return existing;
        }
        const layout = pipeline.getBindGroupLayout(bindGroupIndex);
        const group = device.createBindGroup({
            layout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: debugBuffer,
                    },
                },
            ],
        });
        bindGroups.set(pipeline, group);
        return group;
    };

    const setBindGroup = (
        pipeline: GPURenderPipeline,
        pass: GPURenderPassEncoder
    ): void => {
        const group = resolveBindGroup(pipeline);
        if (!group) {
            return;
        }
        pass.setBindGroup(bindGroupIndex, group);
    };

    const fetch = (encoder: GPUCommandEncoder): void => {
        if (!debugBuffer || !readbackBuffer || readbackPending || mapInFlight) {
            return;
        }
        const bufferSize = 4 + capacity * WGSL_DEBUG_ENTRY_SIZE;
        encoder.copyBufferToBuffer(
            debugBuffer,
            0,
            readbackBuffer,
            0,
            bufferSize
        );
        readbackPending = true;
    };

    const post = async (): Promise<void> => {
        if (!readbackBuffer || !debugBuffer || !device || !readbackPending) {
            return;
        }

        readbackPending = false;
        mapInFlight = true;
        let mapped = false;

        try {
            await readbackBuffer.mapAsync(GPUMapMode.READ);
            mapped = true;
            const data = new Uint32Array(readbackBuffer.getMappedRange());
            const count = Math.min(data[0], capacity);

            if (count > 0) {
                const entries: string[] = [];
                const radiusValues: number[] = [];
                const bitScratch = new Uint32Array(1);
                const floatScratch = new Float32Array(bitScratch.buffer);
                const toF32 = (bits: number): number => {
                    bitScratch[0] = bits;
                    return floatScratch[0];
                };
                for (let i = 0; i < count; i++) {
                    const offset = 1 + i * 4;
                    const kind = data[offset];
                    const xBits = data[offset + 1];
                    const yBits = data[offset + 2];
                    const zBits = data[offset + 3];

                    if (kind === DEBUG_KIND_RADIUS) {
                        radiusValues.push(toF32(xBits));
                        continue;
                    }

                    const formatted = formatDebugEntry(
                        kind,
                        toF32(xBits),
                        toF32(yBits),
                        toF32(zBits)
                    );
                    entries.push(`  [${i}] ${formatted}`);
                }
                if (radiusValues.length > 0) {
                    const latestRadius = radiusValues[radiusValues.length - 1];
                    const shouldLogRadius =
                        lastRadius === undefined ||
                        Math.abs(latestRadius - lastRadius) > 0.001;
                    if (shouldLogRadius) {
                        console.log(
                            `[Glow][WebGPU] radiusPx=${formatFloat(latestRadius)} (samples=${radiusValues.length})`
                        );
                        lastRadius = latestRadius;
                    }
                }
                if (entries.length > 0) {
                    console.log(
                        `[WebGPU Debug] Captured ${entries.length} log entries:\n${entries.join('\n')}`
                    );
                }
            }
        } finally {
            if (mapped) {
                readbackBuffer.unmap();
            }

            const resetData = new Uint32Array(1);
            resetData[0] = 0;
            device.queue.writeBuffer(debugBuffer, 0, resetData);
            mapInFlight = false;
        }
    };

    return {
        buf: debugBuffer!,
        readbackBuf: readbackBuffer!,
        setup,
        isActive,
        addShader,
        setBindGroup,
        fetch,
        post,
    };
};
