import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import {
    Scene,
    SceneRenderLayer,
    SceneRenderOptions,
    SceneRenderResult,
} from '../animation/sceneSystem';
import { useSceneRenderer } from '../animation/sceneRenderer';

export type EffectSceneProps<State extends Record<string, unknown>> = {
    readonly scene: Scene<State>;
    readonly options?: SceneRenderOptions;
    readonly children?: React.ReactNode;
};

const layersByPlacement = (
    layers: ReadonlyArray<SceneRenderLayer>
): Record<string, ReadonlyArray<SceneRenderLayer>> =>
    layers.reduce<Record<string, SceneRenderLayer[]>>((acc, layer) => {
        const placement = layer.placement;
        if (!acc[placement]) {
            acc[placement] = [];
        }
        acc[placement].push(layer);
        return acc;
    }, {});

const renderLayers = (
    layers: ReadonlyArray<SceneRenderLayer>,
    placement: string
): React.ReactNode =>
    layers.map((layer) =>
        layer.placement === placement && layer.element !== null ? (
            <React.Fragment key={layer.id}>{layer.element}</React.Fragment>
        ) : null
    );

export const EffectScene = <State extends Record<string, unknown>>({
    scene,
    options,
    children,
}: EffectSceneProps<State>): React.ReactElement => {
    const result: SceneRenderResult = useSceneRenderer(scene, options);

    const grouped = layersByPlacement(result.layers);
    const backgroundLayers = grouped['background'] ?? [];
    const contentLayers = grouped['content'] ?? [];
    const foregroundLayers = grouped['foreground'] ?? [];

    if (Platform.OS === 'web') {
        return (
            <div
                style={result.containerStyle as React.CSSProperties | undefined}
            >
                {renderLayers(backgroundLayers, 'background')}
                <div style={styles.contentWeb as React.CSSProperties}>
                    {renderLayers(contentLayers, 'content')}
                    {children}
                </div>
                {renderLayers(foregroundLayers, 'foreground')}
            </div>
        );
    }

    return (
        <View style={[styles.container, result.containerStyle]}>
            {renderLayers(backgroundLayers, 'background')}
            <View style={styles.content}>
                {renderLayers(contentLayers, 'content')}
                {children}
            </View>
            {renderLayers(foregroundLayers, 'foreground')}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        width: '100%',
        height: '100%',
    },
    content: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
    },
    contentWeb: {
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
    },
});
