import { selectFirst } from '../resources';

export type WebGLLoseContextExtension = {
    readonly loseContext: () => void;
    readonly restoreContext: () => void;
};

export const resolveLoseContextExtension = (
    gl: WebGLRenderingContext | WebGL2RenderingContext
): WebGLLoseContextExtension | undefined =>
    selectFirst<WebGLLoseContextExtension>([
        gl.getExtension?.('WEBGL_lose_context') as
            | WebGLLoseContextExtension
            | null
            | undefined,
        gl.getExtension?.('WEBKIT_WEBGL_lose_context') as
            | WebGLLoseContextExtension
            | null
            | undefined,
        gl.getExtension?.('MOZ_WEBGL_lose_context') as
            | WebGLLoseContextExtension
            | null
            | undefined,
    ]);

export const createContextState = (
    gl: WebGLRenderingContext | WebGL2RenderingContext
) => {
    let isActive = true;

    return {
        isActive: () => isActive,
        lose: () => {
            if (!isActive) {
                return;
            }
            const extension = resolveLoseContextExtension(gl);
            const maybeLoseContext = extension?.loseContext;
            if (typeof maybeLoseContext === 'function') {
                maybeLoseContext.call(extension);
            }
            isActive = false;
        },
        restore: () => {
            if (isActive) {
                return;
            }
            const extension = resolveLoseContextExtension(gl);
            const maybeRestore = extension?.restoreContext;
            if (typeof maybeRestore === 'function') {
                maybeRestore.call(extension);
                isActive = true;
            }
        },
    };
};

export const compileShader = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    type: number,
    source: string
) => {
    const shader = gl.createShader(type);
    if (!shader) {
        throw new Error('Unable to create shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        const info = gl.getShaderInfoLog(shader) ?? 'Shader compilation failed';
        gl.deleteShader(shader);
        throw new Error(info);
    }

    return shader;
};

export const createShaderProgram = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    vertexSource: string,
    fragmentSource: string
) => {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        fragmentSource
    );

    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error('Unable to create program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        const info = gl.getProgramInfoLog(program) ?? 'Program linking failed';
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        throw new Error(info);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    return program;
};

export const createFullscreenQuad = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    program: WebGLProgram
) => {
    const buffer = gl.createBuffer();
    if (!buffer) {
        throw new Error('Unable to create buffer');
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const location = gl.getAttribLocation(program, 'position');
    if (location === -1) {
        throw new Error('Missing position attribute');
    }

    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

    return buffer;
};

let cachedWebGLAvailability: boolean | undefined;

export const checkWebGLAvailable = (): boolean => {
    if (cachedWebGLAvailability !== undefined) {
        return cachedWebGLAvailability;
    }

    if (typeof document === 'undefined') {
        cachedWebGLAvailability = false;
        return cachedWebGLAvailability;
    }

    const canvas = document.createElement('canvas');
    const context =
        canvas.getContext('webgl2', { premultipliedAlpha: true }) ??
        canvas.getContext('webgl', { premultipliedAlpha: true });

    if (context && typeof context === 'object') {
        const loseContextExtension =
            context.getExtension?.('WEBGL_lose_context');
        if (loseContextExtension && typeof loseContextExtension === 'object') {
            const maybeLoseContext = Reflect.get(
                loseContextExtension,
                'loseContext'
            );
            if (typeof maybeLoseContext === 'function') {
                maybeLoseContext.call(loseContextExtension);
            }
        }
    }

    cachedWebGLAvailability = context !== null;
    return cachedWebGLAvailability;
};
