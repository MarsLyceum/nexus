type SurfaceId = string;

export type SurfaceLayout = {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly dpr: number;
};

export type CanvasSurfaceSnapshot = {
    readonly canvas: HTMLCanvasElement;
    readonly opacity: number;
};

export type CanvasSurfaceHandle = {
    readonly id: SurfaceId;
    readonly canvas: HTMLCanvasElement;
    readonly setLayout: (layout: SurfaceLayout | undefined) => void;
    readonly setOpacity: (opacity: number) => void;
    readonly setVisible: (value: boolean) => void;
    readonly setBlendMode: (mode: GlobalCompositeOperation) => void;
    readonly setSnapshot: (snapshot: CanvasSurfaceSnapshot | undefined) => void;
    readonly setZIndex: (value: number) => void;
    readonly dispose: () => void;
};

type SurfaceState = {
    readonly id: SurfaceId;
    readonly canvas: HTMLCanvasElement;
    readonly blendMode: GlobalCompositeOperation;
    readonly layout: SurfaceLayout | undefined;
    readonly opacity: number;
    readonly visible: boolean;
    readonly snapshot: CanvasSurfaceSnapshot | undefined;
    readonly zIndex: number;
};

type CanvasManagerState = {
    readonly surfaces: Map<SurfaceId, SurfaceState>;
    readonly frameId: number | undefined;
};

type SurfaceRegistration = {
    readonly descriptorId: string;
    readonly zIndex: number;
    readonly blendMode: GlobalCompositeOperation;
};

type CanvasManager = {
    readonly registerSurface: (
        input: SurfaceRegistration
    ) => CanvasSurfaceHandle;
};

const clampOpacity = (value: number): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }
    if (value <= 0) {
        return 0;
    }
    if (value >= 1) {
        return 1;
    }
    return value;
};

const createGlobalCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.dataset.effectCanvasManager = 'true';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2147483647';
    document.body.append(canvas);
    return canvas;
};

const ensureContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Failed to acquire 2D context for canvas manager');
    }
    return context;
};

const adjustOutputCanvasSize = (canvas: HTMLCanvasElement, dpr: number) => {
    const width = Math.max(1, Math.floor(window.innerWidth));
    const height = Math.max(1, Math.floor(window.innerHeight));
    const pixelWidth = Math.max(1, Math.floor(width * dpr));
    const pixelHeight = Math.max(1, Math.floor(height * dpr));
    if (canvas.width !== pixelWidth) {
        canvas.width = pixelWidth;
    }
    if (canvas.height !== pixelHeight) {
        canvas.height = pixelHeight;
    }
    const cssWidth = `${width}px`;
    const cssHeight = `${height}px`;
    if (canvas.style.width !== cssWidth) {
        canvas.style.width = cssWidth;
    }
    if (canvas.style.height !== cssHeight) {
        canvas.style.height = cssHeight;
    }
};

const drawSource = (
    context: CanvasRenderingContext2D,
    source: HTMLCanvasElement,
    layout: SurfaceLayout
) => {
    if (layout.width <= 0 || layout.height <= 0) {
        return;
    }
    if (source.width <= 0 || source.height <= 0) {
        return;
    }
    context.drawImage(
        source,
        0,
        0,
        source.width,
        source.height,
        layout.x,
        layout.y,
        layout.width,
        layout.height
    );
};

const renderSurface = (
    context: CanvasRenderingContext2D,
    surface: SurfaceState
) => {
    if (!surface.visible || !surface.layout) {
        return;
    }
    const { layout } = surface;
    const baseOpacity = clampOpacity(surface.opacity);
    const snapshotOpacity = clampOpacity(surface.snapshot?.opacity ?? 0);
    if (baseOpacity <= 0 && snapshotOpacity <= 0) {
        return;
    }
    context.globalCompositeOperation = surface.blendMode;
    if (baseOpacity > 0) {
        context.globalAlpha = baseOpacity;
        drawSource(context, surface.canvas, layout);
    }
    if (snapshotOpacity > 0 && surface.snapshot) {
        context.globalAlpha = snapshotOpacity;
        drawSource(context, surface.snapshot.canvas, layout);
    }
};

const createSurfaceState = (
    id: SurfaceId,
    canvas: HTMLCanvasElement,
    input: SurfaceRegistration
): SurfaceState => ({
    id,
    canvas,
    blendMode: input.blendMode,
    layout: undefined,
    opacity: 0,
    visible: true,
    snapshot: undefined,
    zIndex: input.zIndex,
});

const updateSurfaceState = (
    surfaces: Map<SurfaceId, SurfaceState>,
    id: SurfaceId,
    mutate: (state: SurfaceState) => SurfaceState
): Map<SurfaceId, SurfaceState> => {
    const current = surfaces.get(id);
    if (!current) {
        return surfaces;
    }
    const next = mutate(current);
    if (next === current) {
        return surfaces;
    }
    const updated = new Map(surfaces);
    updated.set(id, next);
    return updated;
};

const removeSurfaceState = (
    surfaces: Map<SurfaceId, SurfaceState>,
    id: SurfaceId
): Map<SurfaceId, SurfaceState> =>
    [...surfaces.entries()].reduce<Map<SurfaceId, SurfaceState>>(
        (accumulator, [key, value]) =>
            key === id ? accumulator : accumulator.set(key, value),
        new Map<SurfaceId, SurfaceState>()
    );

const compositeSurfaces = (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    surfaces: Map<SurfaceId, SurfaceState>
) => {
    const dpr = window.devicePixelRatio ?? 1;
    adjustOutputCanvasSize(canvas, dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    [...surfaces.values()]
        .sort((left, right) => {
            if (left.zIndex === right.zIndex) {
                return left.id.localeCompare(right.id);
            }
            return left.zIndex - right.zIndex;
        })
        .forEach((surface) => {
            renderSurface(context, surface);
        });
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
};

const createCanvasManager = (): CanvasManager => {
    const outputCanvas = createGlobalCanvas();
    const context = ensureContext(outputCanvas);
    let state: CanvasManagerState = {
        surfaces: new Map<SurfaceId, SurfaceState>(),
        frameId: undefined,
    };

    const step = () => {
        state = {
            ...state,
            frameId:
                state.surfaces.size === 0
                    ? undefined
                    : globalThis.requestAnimationFrame(step),
        };
        compositeSurfaces(context, outputCanvas, state.surfaces);
    };

    const ensureAnimation = () => {
        if (state.frameId !== undefined) {
            return;
        }
        state = {
            ...state,
            frameId: globalThis.requestAnimationFrame(step),
        };
    };

    const releaseSurface = (id: SurfaceId) => {
        state = {
            ...state,
            surfaces: removeSurfaceState(state.surfaces, id),
        };
        if (state.surfaces.size === 0 && state.frameId !== undefined) {
            globalThis.cancelAnimationFrame(state.frameId);
            state = { ...state, frameId: undefined };
            context.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
        }
    };

    const registerSurface = (
        input: SurfaceRegistration
    ): CanvasSurfaceHandle => {
        const id = `${input.descriptorId}-${crypto.randomUUID()}`;
        const surfaceCanvas = document.createElement('canvas');
        const host = document.createElement('div');
        host.dataset.effectSurfaceHostId = id;
        host.style.position = 'fixed';
        host.style.top = '0';
        host.style.left = '0';
        host.style.width = '0';
        host.style.height = '0';
        host.style.pointerEvents = 'none';
        host.style.opacity = '0';
        host.style.overflow = 'hidden';
        surfaceCanvas.dataset.effectSurfaceId = id;
        surfaceCanvas.dataset.effectDescriptorId = input.descriptorId;
        surfaceCanvas.style.display = 'block';
        surfaceCanvas.style.width = '0';
        surfaceCanvas.style.height = '0';
        host.append(surfaceCanvas);
        document.body.append(host);
        surfaceCanvas.dataset.effectSurfaceId = id;
        const initial = createSurfaceState(id, surfaceCanvas, input);
        state = {
            ...state,
            surfaces: new Map(state.surfaces).set(id, initial),
        };
        ensureAnimation();

        const setLayout = (layout: SurfaceLayout | undefined) => {
            state = {
                ...state,
                surfaces: updateSurfaceState(state.surfaces, id, (current) => ({
                    ...current,
                    layout,
                })),
            };
            if (!layout) {
                host.style.transform = 'translate3d(-9999px, -9999px, 0)';
                surfaceCanvas.style.width = '0px';
                surfaceCanvas.style.height = '0px';
                return;
            }
            host.style.transform = `translate3d(${layout.x}px, ${layout.y}px, 0)`;
            surfaceCanvas.style.width = `${layout.width}px`;
            surfaceCanvas.style.height = `${layout.height}px`;
            const pixelWidth = Math.max(
                1,
                Math.floor(layout.width * layout.dpr)
            );
            const pixelHeight = Math.max(
                1,
                Math.floor(layout.height * layout.dpr)
            );
            if (surfaceCanvas.width !== pixelWidth) {
                surfaceCanvas.width = pixelWidth;
            }
            if (surfaceCanvas.height !== pixelHeight) {
                surfaceCanvas.height = pixelHeight;
            }
        };

        const setOpacity = (opacity: number) => {
            state = {
                ...state,
                surfaces: updateSurfaceState(state.surfaces, id, (current) => ({
                    ...current,
                    opacity: clampOpacity(opacity),
                })),
            };
        };

        const setVisible = (value: boolean) => {
            state = {
                ...state,
                surfaces: updateSurfaceState(state.surfaces, id, (current) => ({
                    ...current,
                    visible: value,
                })),
            };
        };

        const setBlendMode = (mode: GlobalCompositeOperation) => {
            state = {
                ...state,
                surfaces: updateSurfaceState(state.surfaces, id, (current) => ({
                    ...current,
                    blendMode: mode,
                })),
            };
        };

        const setSnapshot = (snapshot: CanvasSurfaceSnapshot | undefined) => {
            state = {
                ...state,
                surfaces: updateSurfaceState(state.surfaces, id, (current) => ({
                    ...current,
                    snapshot,
                })),
            };
        };

        const setZIndex = (value: number) => {
            state = {
                ...state,
                surfaces: updateSurfaceState(state.surfaces, id, (current) => ({
                    ...current,
                    zIndex: value,
                })),
            };
        };

        const dispose = () => {
            host.remove();
            releaseSurface(id);
        };

        return {
            id,
            canvas: surfaceCanvas,
            setLayout,
            setOpacity,
            setVisible,
            setBlendMode,
            setSnapshot,
            setZIndex,
            dispose,
        } satisfies CanvasSurfaceHandle;
    };

    return {
        registerSurface,
    } satisfies CanvasManager;
};

let singleton: CanvasManager | undefined;

export const getCanvasManager = (): CanvasManager => {
    if (singleton) {
        return singleton;
    }
    if (typeof document === 'undefined' || typeof globalThis === 'undefined') {
        throw new TypeError(
            'CanvasManager is only available in browser environments'
        );
    }
    singleton = createCanvasManager();
    return singleton;
};
