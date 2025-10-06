/* eslint-disable no-param-reassign */
import type {
    ShaderBackend,
    ShaderBackendConfig,
    ShaderProgram,
    WebGLUniformEncoder,
} from '../types';
import { setCanvasSize } from '../resources';
import {
    checkWebGLAvailable,
    createShaderProgram,
    createFullscreenQuad,
    createContextState,
} from './webgl-utils';
import { createFrameCounter } from '../debug/utils';

type RenderPass<State> = {
    readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
    readonly program: WebGLProgram;
    readonly buffer: WebGLBuffer;
    readonly uniformEncoder: WebGLUniformEncoder<State>;
};

const executeRenderPass = <State>(
    pass: RenderPass<State>,
    uniformData: State,
    width: number,
    height: number,
    dpr: number
) => {
    const canvas = pass.gl.canvas as HTMLCanvasElement;
    setCanvasSize(canvas, { width, height, dpr });

    pass.gl.viewport(0, 0, canvas.width, canvas.height);
    pass.gl.clearColor(0, 0, 0, 0);
    pass.gl.clear(pass.gl.COLOR_BUFFER_BIT);
    pass.gl.useProgram(pass.program);
    pass.gl.bindBuffer(pass.gl.ARRAY_BUFFER, pass.buffer);
    pass.uniformEncoder(pass.gl, pass.program, uniformData);
    pass.gl.drawArrays(pass.gl.TRIANGLE_STRIP, 0, 4);
};

export const createWebGLBackend = <State>(): ShaderBackend<State> => ({
    type: 'webgl',
    isAvailable: checkWebGLAvailable,
    // eslint-disable-next-line @typescript-eslint/require-await
    createProgram: async (
        config: ShaderBackendConfig<State>
    ): Promise<ShaderProgram<State>> => {
        const { canvas, metrics, source, uniformEncoder, onError } = config;

        if (!source.webgl) {
            throw new Error('WebGL shader source not provided');
        }
        if (!uniformEncoder.webgl) {
            throw new Error('WebGL uniform encoder not provided');
        }

        const context = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
        });
        const gl =
            context ??
            canvas.getContext('webgl', {
                preserveDrawingBuffer: true,
            });

        if (!gl) {
            throw new Error('webgl context unavailable');
        }

        setCanvasSize(canvas, {
            width: metrics.width,
            height: metrics.height,
            dpr: metrics.dpr,
        });

        const program = createShaderProgram(
            gl,
            source.webgl.vertex,
            source.webgl.fragment
        );
        const buffer = createFullscreenQuad(gl, program);
        const nextFrameId = createFrameCounter();
        const contextState = createContextState(gl);

        const renderPass: RenderPass<State> = {
            gl,
            program,
            buffer,
            uniformEncoder: uniformEncoder.webgl,
        };

        canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
            const error = new Error('WebGL context lost');
            onError?.(error);
        });

        return {
            id: 'webgl',
            backend: 'webgl',
            render: (command) => {
                executeRenderPass(
                    renderPass,
                    command.uniformData,
                    command.metrics.width,
                    command.metrics.height,
                    command.metrics.dpr
                );
            },
            destroy: () => {
                if (contextState.isActive()) {
                    contextState.lose();
                }
                gl.canvas.width = 0;
                gl.canvas.height = 0;
                gl.deleteBuffer(buffer);
                gl.deleteProgram(program);
            },
        };
    },
});
