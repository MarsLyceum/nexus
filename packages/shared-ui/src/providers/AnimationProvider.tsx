import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { Platform, View } from 'react-native';

import {
    type Scene,
    type SceneRenderLayer,
    type SceneRenderLayerPlacement,
} from '../animation/sceneSystem';
import { useSceneRenderer } from '../animation/sceneRenderer';
import { buildGlowScene, type GlowSceneState } from '../effects/glow/glowScene';
import {
    AnimationTimelineProvider,
    createSharedAnimationTimeline,
} from '../animation/timeline';

type AnimationProviderProps = {
    readonly children: React.ReactNode;
    readonly scene?: Scene<GlowSceneState>;
};

type AnimationLayerControls = {
    readonly visibility: Readonly<Record<string, boolean>>;
    readonly setVisibility: (layerId: string, visible: boolean) => void;
    readonly toggleVisibility: (layerId: string) => void;
};

const AnimationLayerContext = createContext<AnimationLayerControls | undefined>(
    undefined
);

const setVisibilityReducer =
    (layerId: string, visible: boolean) => (state: Record<string, boolean>) => {
        if (visible) {
            if (state[layerId] === undefined) {
                return state;
            }
            const next = { ...state };
            delete next[layerId];
            return next;
        }
        if (state[layerId] === false) {
            return state;
        }
        return { ...state, [layerId]: false };
    };

const toggleVisibilityReducer =
    (layerId: string) => (state: Record<string, boolean>) => {
        const current = state[layerId] ?? true;
        if (current === false) {
            const next = { ...state };
            delete next[layerId];
            return next;
        }
        return { ...state, [layerId]: false };
    };

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
    children,
    scene,
}) => {
    const [visibilityOverrides, updateVisibility] = useState<
        Record<string, boolean>
    >({});

    const setLayerVisibility = useCallback(
        (layerId: string, visible: boolean) => {
            updateVisibility(setVisibilityReducer(layerId, visible));
        },
        []
    );

    const toggleLayerVisibility = useCallback((layerId: string) => {
        updateVisibility(toggleVisibilityReducer(layerId));
    }, []);

    const controls = useMemo<AnimationLayerControls>(
        () => ({
            visibility: visibilityOverrides,
            setVisibility: setLayerVisibility,
            toggleVisibility: toggleLayerVisibility,
        }),
        [setLayerVisibility, toggleLayerVisibility, visibilityOverrides]
    );

    const fallbackScene = useMemo(
        () =>
            buildGlowScene({
                color: '#ffffff',
                borderRadius: 0,
                opacity: 1,
                animate: true,
            }),
        []
    );

    const effectiveScene = scene ?? fallbackScene;
    const animationTimeline = useMemo(
        () => createSharedAnimationTimeline(),
        []
    );

    return (
        <AnimationTimelineProvider timeline={animationTimeline}>
            <AnimationLayerContext.Provider value={controls}>
                <AnimationSceneLayout
                    scene={effectiveScene}
                    visibility={visibilityOverrides}
                >
                    {children}
                </AnimationSceneLayout>
            </AnimationLayerContext.Provider>
        </AnimationTimelineProvider>
    );
};

type AnimationSceneLayoutProps = {
    readonly scene: Scene<GlowSceneState>;
    readonly visibility: Readonly<Record<string, boolean>>;
    readonly children: React.ReactNode;
};

const AnimationSceneLayout: React.FC<AnimationSceneLayoutProps> = ({
    scene,
    visibility,
    children,
}) => {
    const { containerStyle, layers } = useSceneRenderer(scene, {
        visibility,
    });

    const backgroundLayers = layers.filter(
        (layer) => layer.placement === 'background'
    );
    const contentLayers = layers.filter(
        (layer) => layer.placement === 'content'
    );
    const foregroundLayers = layers.filter(
        (layer) => layer.placement === 'foreground'
    );

    if (Platform.OS !== 'web') {
        return <View style={containerStyle}>{children}</View>;
    }

    const backgroundNodes = backgroundLayers.map((layer, index) => (
        <LayerContainer
            key={layer.id ?? `animation-layer-background-${index}`}
            layer={layer}
        />
    ));
    const foregroundNodes = foregroundLayers.map((layer, index) => (
        <LayerContainer
            key={layer.id ?? `animation-layer-foreground-${index}`}
            layer={layer}
        />
    ));

    const wrappedChildren = contentLayers.reduceRight<React.ReactNode>(
        (acc, layer, index) => (
            <ContentLayerWrapper
                key={layer.id ?? `animation-layer-content-${index}`}
                layer={layer}
                content={acc}
            />
        ),
        children
    );

    return React.createElement(
        'div',
        {
            style: {
                display: 'flex',
                flex: 1,
                width: '100%',
                height: '100%',
                position: 'relative',
                isolation: 'isolate',
                ...containerStyle,
            },
        },
        ...backgroundNodes,
        wrappedChildren,
        ...foregroundNodes
    );
};

const layerStyleByPlacement: Record<
    SceneRenderLayerPlacement,
    React.CSSProperties
> = {
    background: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
    },
    content: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
    },
    foreground: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
    },
};

const LayerContainer: React.FC<{ layer: SceneRenderLayer }> = ({ layer }) => {
    if (!layer.element) {
        return null;
    }
    const placementStyle = layerStyleByPlacement[layer.placement] ?? {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
    };
    return React.createElement(
        'div',
        {
            style: {
                ...placementStyle,
            },
        },
        layer.element
    );
};

const ContentLayerWrapper: React.FC<{
    layer: SceneRenderLayer;
    content: React.ReactNode;
}> = ({ layer, content }) => {
    if (!layer.element) {
        return <>{content}</>;
    }
    const placementStyle = layerStyleByPlacement.content;
    return React.createElement(
        'div',
        {
            style: {
                ...placementStyle,
            },
        },
        layer.element,
        content
    );
};

export const useAnimationLayers = () => {
    const context = useContext(AnimationLayerContext);
    if (!context) {
        throw new Error(
            'useAnimationLayers must be used within AnimationProvider'
        );
    }
    return context;
};
