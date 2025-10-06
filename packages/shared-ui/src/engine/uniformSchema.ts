import type { WebGLUniformEncoder } from './shader/types';

type UniformType = 'float' | 'vec2' | 'vec3' | 'vec4';

type UniformField<T> = {
    readonly name: string;
    readonly type: UniformType;
    readonly accessor: (
        data: T
    ) =>
        | number
        | readonly [number, number]
        | readonly [number, number, number]
        | readonly [number, number, number, number];
};

export type UniformSchema<T> = ReadonlyArray<UniformField<T>>;

const flattenValue = (
    value: number | readonly number[]
): ReadonlyArray<number> => (typeof value === 'number' ? [value] : value);

export const createWebGPUWriter =
    <T>(schema: UniformSchema<T>): ((data: T, target: Float32Array) => void) =>
    (data: T, target: Float32Array) => {
        const values = schema.flatMap((field) =>
            flattenValue(field.accessor(data))
        );
        target.set(values);
    };

export const countUniformFloats = <T>(schema: UniformSchema<T>): number =>
    schema.reduce((count, field) => {
        switch (field.type) {
            case 'float': {
                return count + 1;
            }
            case 'vec2': {
                return count + 2;
            }
            case 'vec3': {
                return count + 3;
            }
            case 'vec4': {
                return count + 4;
            }
            default: {
                return count;
            }
        }
    }, 0);

type UniformLocations = Record<string, WebGLUniformLocation | null>;

const setUniform = (
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
    type: UniformType,
    value: number | readonly number[]
): void => {
    if (!location) return;

    switch (type) {
        case 'float': {
            gl.uniform1f(location, value as number);
            break;
        }
        case 'vec2': {
            const v = value as readonly [number, number];
            gl.uniform2f(location, v[0], v[1]);
            break;
        }
        case 'vec3': {
            const v = value as readonly [number, number, number];
            gl.uniform3f(location, v[0], v[1], v[2]);
            break;
        }
        case 'vec4': {
            const v = value as readonly [number, number, number, number];
            gl.uniform4f(location, v[0], v[1], v[2], v[3]);
            break;
        }
        default: {
            throw new Error(`Unknown uniform type`);
        }
    }
};

export const createWebGLUniformEncoder = <T>(
    schema: UniformSchema<T>
): WebGLUniformEncoder<T> => {
    const locationCache = new WeakMap<WebGLProgram, UniformLocations>();

    return (
        gl: WebGLRenderingContext | WebGL2RenderingContext,
        program: WebGLProgram,
        data: T
    ) => {
        let locations = locationCache.get(program);

        if (!locations) {
            locations = Object.fromEntries(
                schema.map<[string, WebGLUniformLocation | null]>((field) => [
                    field.name,
                    gl.getUniformLocation(program, field.name),
                ])
            );
            locationCache.set(program, locations);
        }

        schema.forEach((field) => {
            const value = field.accessor(data);
            setUniform(gl, locations[field.name], field.type, value);
        });
    };
};
