import { computeHash } from './resources';

export type WebGPUDevice = {
    readonly gpu: GPU;
    readonly adapter: GPUAdapter;
    readonly device: GPUDevice;
    readonly format: GPUTextureFormat;
};

type DeviceState = {
    readonly gpuDevice: WebGPUDevice;
    refCount: number;
    destroyed: boolean;
    readonly shaderModules: Map<string, GPUShaderModule>;
    readonly pipelines: Map<string, Promise<GPURenderPipeline>>;
};

type ShaderModuleRequest = {
    readonly stage: 'vertex' | 'fragment';
    readonly source: string;
    readonly label: string;
};

type PipelineRequest = {
    readonly key: PipelineKey;
    readonly factory: () => Promise<GPURenderPipeline>;
};

export type PipelineKey = {
    readonly shaderHash: string;
    readonly shaderLength: number;
    readonly vertexEntryPoint: string;
    readonly fragmentEntryPoint: string;
    readonly format: GPUTextureFormat;
    readonly blend: string;
};

export type DeviceLease = {
    readonly device: GPUDevice;
    readonly format: GPUTextureFormat;
    readonly retainShaderModule: (
        request: ShaderModuleRequest
    ) => GPUShaderModule;
    readonly retainPipeline: (
        request: PipelineRequest
    ) => Promise<GPURenderPipeline>;
    readonly release: () => void;
};

const createModuleCacheKey = (stage: 'vertex' | 'fragment', source: string) =>
    `${stage}:${source.length}:${computeHash(source)}`;

const createPipelineCacheKey = (key: PipelineKey) =>
    `${key.vertexEntryPoint}:${key.fragmentEntryPoint}:${key.format}:${key.blend}:${key.shaderLength}:${key.shaderHash}`;

const destroyDevice = (state: DeviceState) => {
    if (state.destroyed) {
        return;
    }
    state.destroyed = true;

    state.shaderModules.forEach((module) => {
        const destroy = (module as unknown as { destroy?: () => void }).destroy;
        destroy?.();
    });
    state.shaderModules.clear();
    state.pipelines.clear();
    state.gpuDevice.device.destroy?.();
};

const requestWebGPUDevice = async (): Promise<WebGPUDevice> => {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
        throw new Error('WebGPU unavailable');
    }

    const { gpu } = navigator;
    const adapter = await gpu.requestAdapter();
    if (!adapter) {
        throw new Error('WebGPU adapter unavailable');
    }

    const device = await adapter.requestDevice();
    const format = gpu.getPreferredCanvasFormat();

    return { gpu, adapter, device, format };
};

export const createDeviceAllocator = () => {
    let state: DeviceState | undefined;
    let pending: Promise<DeviceState> | undefined;

    const resetState = (target: DeviceState) => {
        destroyDevice(target);
        if (state === target) {
            state = undefined;
            pending = undefined;
        }
    };

    const ensureState = async (): Promise<DeviceState> => {
        if (state) {
            return state;
        }

        pending ??= (async () => {
            const gpuDevice = await requestWebGPUDevice();
            const nextState: DeviceState = {
                gpuDevice,
                refCount: 0,
                destroyed: false,
                shaderModules: new Map(),
                pipelines: new Map(),
            };

            void gpuDevice.device.lost
                .then(() => {
                    resetState(nextState);
                    return undefined;
                })
                .catch(() => {
                    resetState(nextState);
                    return undefined;
                });

            return nextState;
        })();

        state = await pending;
        return state;
    };

    const acquire = async (): Promise<DeviceLease> => {
        const nextState = await ensureState();
        nextState.refCount += 1;

        let released = false;

        const release = () => {
            if (released) {
                return;
            }
            released = true;
            nextState.refCount = Math.max(0, nextState.refCount - 1);

            if (nextState.refCount === 0) {
                resetState(nextState);
            }
        };

        const retainShaderModule = (request: ShaderModuleRequest) => {
            const key = createModuleCacheKey(request.stage, request.source);
            const existing = nextState.shaderModules.get(key);

            if (existing) {
                return existing;
            }

            const module = nextState.gpuDevice.device.createShaderModule({
                code: request.source,
                label: request.label,
            });
            nextState.shaderModules.set(key, module);
            return module;
        };

        const retainPipeline = async (
            request: PipelineRequest
        ): Promise<GPURenderPipeline> => {
            const cacheKey = createPipelineCacheKey(request.key);
            const existing = nextState.pipelines.get(cacheKey);

            if (existing) {
                return existing;
            }

            const created = request.factory();
            nextState.pipelines.set(cacheKey, created);

            try {
                return await created;
            } catch (error) {
                nextState.pipelines.delete(cacheKey);
                throw error;
            }
        };

        return {
            device: nextState.gpuDevice.device,
            format: nextState.gpuDevice.format,
            retainShaderModule,
            retainPipeline,
            release,
        };
    };

    const invalidate = () => {
        if (!state) {
            pending = undefined;
            return;
        }
        resetState(state);
    };

    return { acquire, invalidate };
};
