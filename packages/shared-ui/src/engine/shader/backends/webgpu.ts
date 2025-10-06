/* eslint-disable no-param-reassign */
import { createWGSLDebug } from '../../wgslDebug';
import type {
    ShaderBackend,
    ShaderBackendConfig,
    ShaderProgram,
    UniformEncoder,
} from '../types';
import { setCanvasSize, computeHash } from '../resources';
import { createDeviceAllocator, type PipelineKey } from '../device';
import {
    checkWebGPUAvailable,
    createConfigurationTracker,
    reportShaderCompilation,
} from './webgpu-utils';
import { createFrameCounter } from '../debug/utils';

const DEFAULT_CLEAR_COLOR: GPUColorDict = {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
};

const deviceAllocator = createDeviceAllocator();

type RenderPass<State> = {
    readonly device: GPUDevice;
    readonly pipeline: GPURenderPipeline;
    readonly uniformBuffer: GPUBuffer;
    readonly bindGroup: GPUBindGroup;
    readonly context: GPUCanvasContext;
    readonly uniformEncoder: UniformEncoder<State>;
    readonly debug?: {
        readonly configurePass?: (pass: GPURenderPassEncoder) => void;
        readonly afterPass?: (commandEncoder: GPUCommandEncoder) => void;
        readonly afterSubmit?: () => void;
    };
};

const executeRenderPass = <State>(
    pass: RenderPass<State>,
    uniformData: State
) => {
    const commandEncoder = pass.device.createCommandEncoder();
    const swapTexture = pass.context.getCurrentTexture();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: swapTexture.createView(),
                resolveTarget: undefined,
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: DEFAULT_CLEAR_COLOR,
            },
        ],
    });

    const data = pass.uniformEncoder.encode(uniformData);
    pass.device.queue.writeBuffer(
        pass.uniformBuffer,
        0,
        data.buffer,
        data.byteOffset,
        data.byteLength
    );

    passEncoder.setPipeline(pass.pipeline);
    passEncoder.setBindGroup(0, pass.bindGroup);
    pass.debug?.configurePass?.(passEncoder);
    passEncoder.draw(4, 1, 0, 0);
    passEncoder.end();
    pass.debug?.afterPass?.(commandEncoder);
    pass.device.queue.submit([commandEncoder.finish()]);
    pass.debug?.afterSubmit?.();
};

const createBlendState = (): GPUBlendState => ({
    color: {
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
    },
    alpha: {
        srcFactor: 'one',
        dstFactor: 'one-minus-src-alpha',
        operation: 'add',
    },
});

export const createWebGPUBackend = <State>(): ShaderBackend<State> => ({
    type: 'webgpu',
    isAvailable: checkWebGPUAvailable,
    createProgram: async (
        config: ShaderBackendConfig<State>
    ): Promise<ShaderProgram<State>> => {
        const {
            canvas,
            metrics,
            source,
            uniformEncoder,
            debug: debugConfig,
            onError,
        } = config;

        if (!source.webgpu) {
            throw new Error('WebGPU shader source not provided');
        }
        if (!uniformEncoder.webgpu) {
            throw new Error('WebGPU uniform encoder not provided');
        }

        const lease = await deviceAllocator.acquire();
        const { device, format } = lease;

        const context = canvas.getContext('webgpu');
        if (!context) {
            lease.release();
            throw new Error('webgpu canvas context unavailable');
        }

        const contextWithUnconfigure = context as unknown as {
            readonly unconfigure?: () => void;
        };

        const configurationTracker = createConfigurationTracker();
        const nextFrameId = createFrameCounter();

        const unconfigureCanvas = () => {
            const { unconfigure } = contextWithUnconfigure;
            if (typeof unconfigure === 'function') {
                unconfigure.call(context);
            }
            configurationTracker.reset();
        };

        let uniformBuffer: GPUBuffer | undefined;
        let debug: ReturnType<typeof createWGSLDebug> | undefined;
        const { queue } = device;
        let disposed = false;
        let finalizing = false;
        let pendingConfigure: Promise<void> | null = null;

        const waitForQueueIdle = () =>
            queue.onSubmittedWorkDone().catch((error) => {
                console.warn(
                    '[WebGPU] queue.onSubmittedWorkDone rejected',
                    error
                );
            });

        const awaitPendingConfigure = (
            pending: Promise<void> | null
        ): Promise<void> =>
            pending
                ?.catch((error) => {
                    console.warn('[WebGPU] pending configure rejected', error);
                })
                .then(() => undefined) ?? Promise.resolve();

        const waitForPendingConfigure = () =>
            awaitPendingConfigure(pendingConfigure);

        const settleGpuWork = (
            pending: Promise<void> | null = pendingConfigure
        ) =>
            Promise.all([
                waitForQueueIdle(),
                awaitPendingConfigure(pending),
            ]).catch((error) => {
                console.warn('[WebGPU] GPU work settle failed', error);
            });

        const finalizeContext = () => {
            if (finalizing) {
                return;
            }
            finalizing = true;
            const previousPending = pendingConfigure;
            pendingConfigure = null;

            awaitPendingConfigure(previousPending)
                .catch((error) => {
                    console.warn(
                        '[WebGPU] finalizeContext pending configure failed',
                        error
                    );
                })
                .finally(() => {
                    unconfigureCanvas();
                    canvas.width = 0;
                    canvas.height = 0;
                })
                .then(() => waitForQueueIdle())
                .catch((error) => {
                    console.warn(
                        '[WebGPU] finalizeContext queue idle wait failed',
                        error
                    );
                })
                .finally(() => {
                    canvas.removeEventListener(
                        'webgpucontextlost',
                        handleContextLost
                    );
                    if (uniformBuffer) {
                        uniformBuffer.destroy();
                        uniformBuffer = undefined;
                    }
                    if (debug) {
                        debug.dispose?.();
                        debug = undefined;
                    }
                    lease.release();
                });
        };

        const handleContextLost = (event: Event) => {
            event.preventDefault();
            if (disposed) {
                return;
            }
            disposed = true;
            const error = new Error('WebGPU context lost');
            onError?.(error);
            deviceAllocator.invalidate();
            finalizeContext();
        };

        canvas.addEventListener('webgpucontextlost', handleContextLost);

        try {
            const configureContextIfNeeded = (
                pixelWidth: number,
                pixelHeight: number
            ) => {
                if (pixelWidth <= 0 || pixelHeight <= 0) {
                    console.warn(
                        '[WebGPU] skipping configure for empty metrics',
                        {
                            pixelWidth,
                            pixelHeight,
                        }
                    );
                    if (configurationTracker.isConfigured()) {
                        pendingConfigure = pendingConfigure
                            ? pendingConfigure.then(() =>
                                  settleGpuWork(pendingConfigure)
                              )
                            : settleGpuWork(null);
                        pendingConfigure = pendingConfigure.then(() => {
                            if (disposed) {
                                return;
                            }
                            unconfigureCanvas();
                        });
                    }
                    return;
                }

                if (configurationTracker.matches(pixelWidth, pixelHeight)) {
                    return;
                }

                if (disposed) {
                    return;
                }

                const previous =
                    pendingConfigure?.catch((error) => {
                        console.warn(
                            '[WebGPU] pending configure rejected',
                            error
                        );
                        return undefined;
                    }) ?? Promise.resolve();

                const scheduled = previous.then(async () => {
                    if (disposed) {
                        return;
                    }
                    await settleGpuWork(previous);
                    if (disposed) {
                        return;
                    }
                    if (pixelWidth <= 0 || pixelHeight <= 0) {
                        return;
                    }
                    if (canvas.width !== pixelWidth) {
                        canvas.width = pixelWidth;
                    }
                    if (canvas.height !== pixelHeight) {
                        canvas.height = pixelHeight;
                    }
                    if (canvas.width <= 0 || canvas.height <= 0) {
                        return;
                    }
                    unconfigureCanvas();
                    context.configure({
                        device,
                        format,
                        alphaMode: 'premultiplied',
                        colorSpace: 'srgb',
                        usage: GPUTextureUsage.RENDER_ATTACHMENT,
                    });
                    configurationTracker.mark(pixelWidth, pixelHeight);
                });

                const tracked = scheduled.catch((error) => {
                    console.warn(
                        '[WebGPU] configureContextIfNeeded failed',
                        error
                    );
                    throw error;
                });

                let next: Promise<void>;
                next = tracked.finally(() => {
                    if (pendingConfigure === next) {
                        pendingConfigure = null;
                    }
                });
                pendingConfigure = next;
            };

            const configureSurface = (
                width: number,
                height: number,
                dpr: number
            ) => {
                setCanvasSize(canvas, { width, height, dpr });
                const pixelWidth = canvas.width;
                const pixelHeight = canvas.height;
                configureContextIfNeeded(pixelWidth, pixelHeight);
            };

            configureSurface(metrics.width, metrics.height, metrics.dpr);
            await waitForPendingConfigure();

            const vertexEntryPoint =
                source.webgpu.entryPoints?.vertex ?? 'main';
            const fragmentEntryPoint =
                source.webgpu.entryPoints?.fragment ?? 'main';

            const debugEnabled = debugConfig?.enabled ?? false;
            debug = debugEnabled
                ? createWGSLDebug(debugConfig?.bindGroupIndex ?? 1)
                : undefined;

            if (debug && !debug.isActive()) {
                await settleGpuWork();
                if (disposed) {
                    throw new Error('WebGPU backend disposed during setup');
                }
                await debug.setup(
                    device,
                    debugConfig?.invocationCapacity ?? 4096
                );
            }

            const instrumentedShaderSource = debug
                ? debug.addShader(source.webgpu.code, true)
                : source.webgpu.code;

            const vertexModule = lease.retainShaderModule({
                stage: 'vertex',
                source: instrumentedShaderSource,
                label: 'shader-vertex-module',
            });
            const fragmentModule = lease.retainShaderModule({
                stage: 'fragment',
                source: instrumentedShaderSource,
                label: 'shader-fragment-module',
            });

            const blendState = createBlendState();
            const pipelineKey: PipelineKey = {
                shaderHash: computeHash(instrumentedShaderSource),
                shaderLength: instrumentedShaderSource.length,
                vertexEntryPoint,
                fragmentEntryPoint,
                format,
                blend: JSON.stringify(blendState),
            };

            const pipeline = await lease.retainPipeline({
                key: pipelineKey,
                factory: async () => {
                    try {
                        return await device.createRenderPipelineAsync({
                            layout: 'auto',
                            vertex: {
                                module: vertexModule,
                                entryPoint: vertexEntryPoint,
                            },
                            fragment: {
                                module: fragmentModule,
                                entryPoint: fragmentEntryPoint,
                                targets: [
                                    {
                                        format,
                                        blend: blendState,
                                    },
                                ],
                            },
                            primitive: {
                                topology: 'triangle-strip',
                                stripIndexFormat: undefined,
                            },
                        });
                    } catch (error) {
                        const details = await Promise.all([
                            reportShaderCompilation(vertexModule, 'vertex'),
                            reportShaderCompilation(fragmentModule, 'fragment'),
                        ]);
                        const flattenedDetails = details.flat();
                        if (
                            error instanceof Error &&
                            flattenedDetails.length > 0
                        ) {
                            error.message = `${error.message}\n${flattenedDetails.join('\n')}`;
                            (
                                error as Error & {
                                    shaderDiagnostics?: ReadonlyArray<string>;
                                }
                            ).shaderDiagnostics = flattenedDetails;
                        }
                        console.error(
                            '[WebGPU] Failed to create render pipeline',
                            error
                        );
                        throw error;
                    }
                },
            });

            const encoder = uniformEncoder.webgpu;
            uniformBuffer = device.createBuffer({
                size: encoder.bufferSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            });

            const bindGroupLayout = pipeline.getBindGroupLayout(0);
            const bindGroup = device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: {
                            buffer: uniformBuffer,
                        },
                    },
                ],
            });

            const renderPass: RenderPass<State> = {
                device,
                pipeline,
                uniformBuffer,
                bindGroup,
                context,
                uniformEncoder: encoder,
                debug: debug
                    ? {
                          configurePass: (passEncoder) => {
                              debug.setBindGroup(pipeline, passEncoder);
                          },
                          afterPass: (commandEncoder) => {
                              debug.fetch(commandEncoder);
                          },
                          afterSubmit: () => {
                              void debug.post();
                          },
                      }
                    : undefined,
            };

            return {
                id: 'webgpu',
                backend: 'webgpu',
                render: (command) => {
                    configureSurface(
                        command.metrics.width,
                        command.metrics.height,
                        command.metrics.dpr
                    );
                    if (pendingConfigure) {
                        return;
                    }
                    executeRenderPass(renderPass, command.uniformData);
                },
                destroy: () => {
                    if (disposed) {
                        return;
                    }
                    disposed = true;
                    finalizeContext();
                },
            };
        } catch (error) {
            disposed = true;
            finalizeContext();
            throw error;
        }
    },
});
