import { now } from './utils';

type SurfaceId = string;
type GroupId = string;

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
    readonly groupId: GroupId;
    readonly canvas: HTMLCanvasElement;
    readonly setLayout: (layout: SurfaceLayout | undefined) => void;
    readonly setOpacity: (opacity: number) => void;
    readonly setVisible: (value: boolean) => void;
    readonly setBlendMode: (mode: GlobalCompositeOperation) => void;
    readonly setSnapshot: (snapshot: CanvasSurfaceSnapshot | undefined) => void;
    readonly setZIndex: (value: number) => void;
    readonly setGroupZIndex: (value: number) => void;
    readonly dispose: () => void;
};

type SurfaceState = {
    readonly id: SurfaceId;
    readonly groupId: GroupId;
    readonly canvas: HTMLCanvasElement;
    readonly blendMode: GlobalCompositeOperation;
    readonly layout: SurfaceLayout | undefined;
    readonly opacity: number;
    readonly visible: boolean;
    readonly snapshot: CanvasSurfaceSnapshot | undefined;
    readonly zIndex: number;
};

type GroupState = {
    readonly id: GroupId;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    readonly zIndex: number;
    readonly surfaceIds: ReadonlySet<SurfaceId>;
};

type CanvasManagerState = {
    readonly surfaces: Map<SurfaceId, SurfaceState>;
    readonly groups: Map<GroupId, GroupState>;
    readonly frameId: number | undefined;
};

type SurfaceRegistration = {
    readonly descriptorId: string;
    readonly groupId?: GroupId;
    readonly groupZIndex?: number;
    readonly zIndex: number;
    readonly blendMode: GlobalCompositeOperation;
};

type RenderQueueItem = {
    readonly surface: SurfaceState;
    readonly group: GroupState;
    readonly globalZIndex: number;
    readonly localZIndex: number;
};

type PooledSurface = {
    readonly id: SurfaceId;
    readonly descriptorId: string;
    readonly groupId: GroupId;
    readonly host: HTMLDivElement;
    readonly canvas: HTMLCanvasElement;
    readonly blendMode: GlobalCompositeOperation;
    readonly createdAt: number;
    releasedAt: number;
};

const SURFACE_POOL_TTL_MS = 15_000;
const SURFACE_POOL_CLEANUP_INTERVAL_MS = 5000;

const createGroupState = (id: GroupId, zIndex: number): GroupState => {
    const canvas = document.createElement('canvas');
    const context = ensureContext(canvas);
    canvas.dataset.effectSurfaceGroupId = id;
    return {
        id,
        canvas,
        context,
        zIndex,
        surfaceIds: new Set<SurfaceId>(),
    } satisfies GroupState;
};

const updateGroupState = (
    groups: Map<GroupId, GroupState>,
    id: GroupId,
    mutate: (state: GroupState) => GroupState
): Map<GroupId, GroupState> => {
    const current = groups.get(id);
    if (!current) {
        return groups;
    }
    const next = mutate(current);
    if (next === current) {
        return groups;
    }
    const updated = new Map(groups);
    updated.set(id, next);
    return updated;
};

const ensureGroup = (
    groups: Map<GroupId, GroupState>,
    groupId: GroupId,
    zIndex: number
): {
    readonly groups: Map<GroupId, GroupState>;
    readonly group: GroupState;
} => {
    const current = groups.get(groupId);
    if (current) {
        if (current.zIndex === zIndex) {
            return { groups, group: current } as const;
        }
        const updated = {
            ...current,
            zIndex,
        } satisfies GroupState;
        const nextGroups = new Map(groups);
        nextGroups.set(groupId, updated);
        return { groups: nextGroups, group: updated } as const;
    }
    const created = createGroupState(groupId, zIndex);
    const nextGroups = new Map(groups);
    nextGroups.set(groupId, created);
    return { groups: nextGroups, group: created } as const;
};

const removeSurfaceFromGroup = (
    groups: Map<GroupId, GroupState>,
    groupId: GroupId,
    surfaceId: SurfaceId
): Map<GroupId, GroupState> => {
    const current = groups.get(groupId);
    if (!current) {
        return groups;
    }
    if (!current.surfaceIds.has(surfaceId)) {
        return groups;
    }
    const remaining = [...current.surfaceIds].filter((id) => id !== surfaceId);
    if (remaining.length === 0) {
        const nextGroups = new Map(groups);
        nextGroups.delete(groupId);
        return nextGroups;
    }
    const updated = {
        ...current,
        surfaceIds: new Set(remaining),
    } satisfies GroupState;
    const nextGroups = new Map(groups);
    nextGroups.set(groupId, updated);
    return nextGroups;
};

const addSurfaceToGroup = (
    groups: Map<GroupId, GroupState>,
    groupId: GroupId,
    zIndex: number,
    surfaceId: SurfaceId
): Map<GroupId, GroupState> => {
    const ensured = ensureGroup(groups, groupId, zIndex);
    const nextSurfaceIds = new Set(ensured.group.surfaceIds).add(surfaceId);
    const updated = {
        ...ensured.group,
        zIndex,
        surfaceIds: nextSurfaceIds,
    } satisfies GroupState;
    const nextGroups = new Map(ensured.groups);
    nextGroups.set(groupId, updated);
    return nextGroups;
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
    groupId: GroupId,
    canvas: HTMLCanvasElement,
    input: SurfaceRegistration
): SurfaceState => ({
    id,
    groupId,
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
): Map<SurfaceId, SurfaceState> => {
    const next = new Map(surfaces);
    next.delete(id);
    return next;
};

const compositeSurfaces = (
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    snapshot: CanvasManagerState
) => {
    const dpr = window.devicePixelRatio ?? 1;
    adjustOutputCanvasSize(canvas, dpr);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const cssWidth = canvas.width / dpr;
    const cssHeight = canvas.height / dpr;

    const renderQueue: RenderQueueItem[] = [];

    const groupedSurfaces = [...snapshot.groups.values()].map((group) => {
        const surfaces = [...group.surfaceIds]
            .map((surfaceId) => snapshot.surfaces.get(surfaceId))
            .filter((surface): surface is SurfaceState => Boolean(surface))
            .sort((left, right) => {
                if (left.zIndex === right.zIndex) {
                    return left.id.localeCompare(right.id);
                }
                return left.zIndex - right.zIndex;
            });
        const groupCanvas = group.canvas;
        const groupContext = group.context;
        if (groupCanvas.width !== canvas.width) {
            groupCanvas.width = canvas.width;
        }
        if (groupCanvas.height !== canvas.height) {
            groupCanvas.height = canvas.height;
        }
        const styleWidth = `${cssWidth}px`;
        const styleHeight = `${cssHeight}px`;
        if (groupCanvas.style.width !== styleWidth) {
            groupCanvas.style.width = styleWidth;
        }
        if (groupCanvas.style.height !== styleHeight) {
            groupCanvas.style.height = styleHeight;
        }
        groupContext.setTransform(1, 0, 0, 1, 0, 0);
        groupContext.clearRect(0, 0, groupCanvas.width, groupCanvas.height);
        groupContext.setTransform(dpr, 0, 0, dpr, 0, 0);

        surfaces.forEach((surface) => {
            renderSurface(groupContext, surface);
            renderQueue.push({
                surface,
                group,
                globalZIndex: group.zIndex,
                localZIndex: surface.zIndex,
            });
        });

        groupContext.globalAlpha = 1;
        groupContext.globalCompositeOperation = 'source-over';

        return group;
    });

    renderQueue.sort((left, right) => {
        if (left.globalZIndex === right.globalZIndex) {
            if (left.localZIndex === right.localZIndex) {
                return left.surface.id.localeCompare(right.surface.id);
            }
            return left.localZIndex - right.localZIndex;
        }
        return left.globalZIndex - right.globalZIndex;
    });

    const preparedGroups = new Set<GroupId>();

    renderQueue.forEach((item) => {
        if (!preparedGroups.has(item.group.id)) {
            preparedGroups.add(item.group.id);
        }
    });

    const sortedGroups = groupedSurfaces
        .filter((group) => preparedGroups.has(group.id))
        .sort((left, right) => {
            if (left.zIndex === right.zIndex) {
                return left.id.localeCompare(right.id);
            }
            return left.zIndex - right.zIndex;
        });

    sortedGroups.forEach((group) => {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = 1;
        context.drawImage(
            group.canvas,
            0,
            0,
            group.canvas.width,
            group.canvas.height,
            0,
            0,
            cssWidth,
            cssHeight
        );
        group.context.globalAlpha = 1;
        group.context.globalCompositeOperation = 'source-over';
    });

    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
};

const createCanvasManager = (): CanvasManager => {
    const outputCanvas = createGlobalCanvas();
    const context = ensureContext(outputCanvas);
    let state: CanvasManagerState = {
        surfaces: new Map<SurfaceId, SurfaceState>(),
        groups: new Map<GroupId, GroupState>(),
        frameId: undefined,
    };

    const surfacePool = new Map<string, PooledSurface>();
    let poolTrimHandle: ReturnType<typeof setTimeout> | undefined;

    const buildPoolKey = (
        descriptorId: string,
        groupId: GroupId | undefined,
        zIndex: number,
        blendMode: GlobalCompositeOperation
    ) => `${descriptorId}:${groupId ?? 'default'}:${zIndex}:${blendMode}`;

    const acquirePooledSurface = (
        poolKey: string
    ): PooledSurface | undefined => {
        const pooled = surfacePool.get(poolKey);
        if (!pooled) {
            return undefined;
        }
        surfacePool.delete(poolKey);
        return pooled;
    };

    const schedulePoolTrim = () => {
        if (poolTrimHandle !== undefined) {
            return;
        }
        poolTrimHandle = setTimeout(() => {
            poolTrimHandle = undefined;
            const nowTs = now();
            const entries = Array.from(surfacePool.entries());
            surfacePool.clear();
            entries.forEach(([key, pooled]) => {
                if (nowTs - pooled.releasedAt <= SURFACE_POOL_TTL_MS) {
                    surfacePool.set(key, pooled);
                    return;
                }
                pooled.host.remove();
            });
            if (surfacePool.size > 0) {
                schedulePoolTrim();
            }
        }, SURFACE_POOL_CLEANUP_INTERVAL_MS);
    };

    const step = () => {
        state = {
            ...state,
            frameId:
                state.surfaces.size === 0
                    ? undefined
                    : globalThis.requestAnimationFrame(step),
        };
        compositeSurfaces(context, outputCanvas, state);
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
        const surface = state.surfaces.get(id);
        const nextSurfaces = removeSurfaceState(state.surfaces, id);
        const nextGroups = surface
            ? removeSurfaceFromGroup(state.groups, surface.groupId, id)
            : state.groups;
        state = {
            ...state,
            surfaces: nextSurfaces,
            groups: nextGroups,
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
        const poolKey = buildPoolKey(
            input.descriptorId,
            input.groupId,
            input.zIndex,
            input.blendMode
        );
        const pooled = acquirePooledSurface(poolKey);
        let surfaceCanvas: HTMLCanvasElement;
        let host: HTMLDivElement;
        let id: SurfaceId;
        if (pooled) {
            id = pooled.id;
            surfaceCanvas = pooled.canvas;
            host = pooled.host;
            surfaceCanvas.dataset.effectDescriptorId = input.descriptorId;
            surfaceCanvas.dataset.effectSurfaceId = id;
            surfaceCanvas.style.display = 'block';
            surfaceCanvas.style.width = '0';
            surfaceCanvas.style.height = '0';
            host.style.opacity = '0';
            host.style.width = '0';
            host.style.height = '0';
            pooled.releasedAt = now();
        } else {
            id = `${input.descriptorId}-${crypto.randomUUID()}`;
            surfaceCanvas = document.createElement('canvas');
            host = document.createElement('div');
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
        }
        surfaceCanvas.dataset.effectSurfaceId = id;
        const groupId = input.groupId ?? 'default';
        const groupZIndex = input.groupZIndex ?? 0;
        const initial = createSurfaceState(id, groupId, surfaceCanvas, input);
        const ensuredGroup = ensureGroup(state.groups, groupId, groupZIndex);
        const nextGroups = addSurfaceToGroup(
            ensuredGroup.groups,
            groupId,
            groupZIndex,
            id
        );
        state = {
            ...state,
            surfaces: new Map(state.surfaces).set(id, initial),
            groups: nextGroups,
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
            releaseSurface(id);
            const pooled: PooledSurface = {
                id,
                descriptorId: input.descriptorId,
                groupId,
                host,
                canvas: surfaceCanvas,
                blendMode: input.blendMode,
                createdAt: now(),
                releasedAt: now(),
            };
            surfacePool.set(poolKey, pooled);
            schedulePoolTrim();
        };

        return {
            id,
            groupId,
            canvas: surfaceCanvas,
            setLayout,
            setOpacity,
            setVisible,
            setBlendMode,
            setSnapshot,
            setZIndex,
            setGroupZIndex: (value: number) => {
                state = {
                    ...state,
                    groups: updateGroupState(
                        state.groups,
                        groupId,
                        (current) => ({
                            ...current,
                            zIndex: value,
                        })
                    ),
                };
            },
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
