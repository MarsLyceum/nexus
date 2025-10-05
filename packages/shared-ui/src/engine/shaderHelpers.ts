/* eslint-disable no-param-reassign */
import type { RenderInput, RenderMetrics } from './types';

export type ShaderUniformData = Float32Array | Uint32Array;

export type ShaderUniformEncoder<UniformData> = {
    readonly encodeUniforms: (state: UniformData) => ShaderUniformData;
    readonly uniformBufferSize: number;
};

export type WebglUniformEncoder<UniformData> = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram,
    state: UniformData
) => void;

type CanvasDimensionsInput = {
    readonly canvas: HTMLCanvasElement;
    readonly metrics: RenderMetrics;
};

export const setCanvasDimensions = ({
    canvas,
    metrics,
}: CanvasDimensionsInput) => {
    const pixelWidth = Math.max(1, Math.floor(metrics.width * metrics.dpr));
    const pixelHeight = Math.max(1, Math.floor(metrics.height * metrics.dpr));
    if (canvas.width !== pixelWidth) {
        canvas.width = pixelWidth;
    }
    if (canvas.height !== pixelHeight) {
        canvas.height = pixelHeight;
    }
    const desiredWidth = `${metrics.width}px`;
    const desiredHeight = `${metrics.height}px`;
    if (canvas.style.width !== desiredWidth) {
        canvas.style.width = desiredWidth;
    }
    if (canvas.style.height !== desiredHeight) {
        canvas.style.height = desiredHeight;
    }
};

const DEFAULT_CLEAR_COLOR: GPUColorDict = {
    r: 0,
    g: 0,
    b: 0,
    a: 0,
};

type WebGpuFrameInput<UniformData> = {
    readonly device: GPUDevice;
    readonly pipeline: GPURenderPipeline;
    readonly uniformBuffer: GPUBuffer;
    readonly bindGroup: GPUBindGroup;
    readonly context: GPUCanvasContext;
    readonly renderInput: RenderInput<UniformData>;
    readonly uniformEncoder: ShaderUniformEncoder<UniformData>;
    readonly clearValue?: GPUColorDict;
    readonly debug?: {
        readonly configurePass?: (pass: GPURenderPassEncoder) => void;
        readonly afterPass?: (commandEncoder: GPUCommandEncoder) => void;
        readonly afterSubmit?: () => void;
    };
};

export const drawWebGpuFrame = <UniformData>(
    input: WebGpuFrameInput<UniformData>
) => {
    const canvas = input.context.canvas as HTMLCanvasElement;
    const { metrics } = input.renderInput;
    setCanvasDimensions({ canvas, metrics });
    if (
        canvas.width !== Math.max(1, Math.floor(metrics.width * metrics.dpr)) ||
        canvas.height !== Math.max(1, Math.floor(metrics.height * metrics.dpr))
    ) {
        console.warn(
            `[Glow][WebGPU] Canvas pixel dimensions mismatch width=${metrics.width.toFixed(6)} height=${metrics.height.toFixed(6)} dpr=${metrics.dpr.toFixed(6)} pixelWidth=${canvas.width} pixelHeight=${canvas.height}`
        );
    }

    const commandEncoder = input.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
        colorAttachments: [
            {
                view: input.context.getCurrentTexture().createView(),
                resolveTarget: undefined,
                loadOp: 'clear',
                storeOp: 'store',
                clearValue: input.clearValue ?? DEFAULT_CLEAR_COLOR,
            },
        ],
    });

    const data = input.uniformEncoder.encodeUniforms(
        input.renderInput.uniformData
    );
    input.device.queue.writeBuffer(
        input.uniformBuffer,
        0,
        data.buffer,
        data.byteOffset,
        data.byteLength
    );

    passEncoder.setPipeline(input.pipeline);
    passEncoder.setBindGroup(0, input.bindGroup);
    input.debug?.configurePass?.(passEncoder);
    passEncoder.draw(4, 1, 0, 0);
    passEncoder.end();
    input.debug?.afterPass?.(commandEncoder);
    input.device.queue.submit([commandEncoder.finish()]);
    input.debug?.afterSubmit?.();
};

type WebglFrameInput<UniformData> = {
    readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly buffer: WebGLBuffer;
    readonly renderInput: RenderInput<UniformData>;
    readonly uniformEncoder: WebglUniformEncoder<UniformData>;
};

export const drawWebglFrame = <UniformData>(
    input: WebglFrameInput<UniformData>
) => {
    const canvas = input.gl.canvas as HTMLCanvasElement;
    const { metrics } = input.renderInput;
    setCanvasDimensions({ canvas, metrics });

    input.gl.viewport(0, 0, canvas.width, canvas.height);
    input.gl.clearColor(0, 0, 0, 0);
    input.gl.clear(input.gl.COLOR_BUFFER_BIT);
    input.gl.useProgram(input.program);
    input.gl.bindBuffer(input.gl.ARRAY_BUFFER, input.buffer);
    input.uniformEncoder(
        input.gl,
        input.program,
        input.renderInput.uniformData
    );
    input.gl.drawArrays(input.gl.TRIANGLE_STRIP, 0, 4);
};
