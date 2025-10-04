import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
    useWindowDimensions,
    Animated,
    Easing,
    type PressableStateCallbackType,
} from 'react-native';

import { useTheme } from '../theme';
import { lightenColor, toRgba } from '../utils';
import { useAnimatedGlow } from '../hooks';
import type { Theme } from '../theme';
import {
    BorderRadius,
    Opacity,
    Spacing,
    Typography,
} from '../constants/designSystem';
import { useThemedScrollbars, NexusScrollView } from '../styles';
import {
    buildGlowScene,
    renderAnimationScene,
    type SceneRenderLayer,
} from '../animation/scenes';
import {
    AnimationProvider,
    useAnimationLayers,
} from '../providers/AnimationProvider';
import { hasWebGPU, hasWebGL } from '../components/WebGPUGlow';

type ErrorFallbackProps = {
    error: Error;
    resetErrorBoundary: () => void;
    componentStack?: string;
    onReset?: () => void;
};

type ParsedStackLine = {
    component: string;
    location: string;
};

type GlowMode = 'webgpu' | 'webgl' | 'css';

const SEGMENT_HEIGHT = 34;
const SEGMENT_HORIZONTAL_PADDING = 10;
const SEGMENT_FADE_DURATION = 160;
const backendOrder: GlowMode[] = ['webgpu', 'webgl', 'css'];
const backendLabels: Record<GlowMode, string> = {
    webgpu: 'WebGPU',
    webgl: 'WebGL',
    css: 'CSS',
};
const backendIcons: Record<GlowMode, string> = {
    webgpu: '⛶',
    webgl: '⬚',
    css: '{}',
};

type SegmentState = {
    readonly hovered: boolean;
    readonly pressed: boolean;
    readonly focused: boolean;
};

type SegmentDescriptor = {
    readonly mode: GlowMode;
    readonly label: string;
    readonly available: boolean;
    readonly active: boolean;
    readonly isDisabled: boolean;
};

const createSegmentDescriptors = (
    availability: Record<GlowMode, boolean>,
    activeBackend: GlowMode
) =>
    backendOrder.map<SegmentDescriptor>((mode) => ({
        mode,
        label: backendLabels[mode],
        available: availability[mode],
        active: activeBackend === mode,
        isDisabled: !availability[mode],
    }));

const createSegmentBoxStyles = (
    styles: ReturnType<typeof createStyles>,
    descriptor: SegmentDescriptor,
    state: SegmentState,
    animatedOpacity: Animated.AnimatedInterpolation<number>
) => [
    styles.segment,
    { opacity: animatedOpacity },
    descriptor.active && styles.segmentActive,
    descriptor.isDisabled && styles.segmentDisabled,
    state.hovered && !descriptor.isDisabled && styles.segmentHovered,
    state.pressed && !descriptor.isDisabled && styles.segmentPressed,
    state.focused && styles.segmentFocused,
];

const createSegmentLabelStyles = (
    styles: ReturnType<typeof createStyles>,
    descriptor: SegmentDescriptor,
    state: SegmentState
) => [
    styles.segmentLabel,
    descriptor.active && styles.segmentLabelActive,
    descriptor.isDisabled && styles.segmentLabelDisabled,
    state.hovered && !descriptor.isDisabled && styles.segmentLabelHovered,
    state.pressed && !descriptor.isDisabled && styles.segmentLabelPressed,
    state.focused && styles.segmentLabelFocused,
];

const mapSegmentState = (state: PressableStateCallbackType) => ({
    hovered: Boolean(state.hovered),
    pressed: Boolean(state.pressed),
    focused: Boolean(state.focused),
});

const createSegmentAnimations = (activeBackend: GlowMode) =>
    backendOrder.reduce<Record<GlowMode, Animated.Value>>(
        (accumulator, mode) => ({
            ...accumulator,
            [mode]: new Animated.Value(mode === activeBackend ? 1 : 0),
        }),
        {} as Record<GlowMode, Animated.Value>
    );

const useSegmentAnimations = (activeBackend: GlowMode) => {
    const animationRef = useRef<Record<GlowMode, Animated.Value>>();
    if (!animationRef.current) {
        animationRef.current = createSegmentAnimations(activeBackend);
    }

    useEffect(() => {
        backendOrder.forEach((mode) => {
            Animated.timing(animationRef.current![mode], {
                toValue: mode === activeBackend ? 1 : 0,
                duration: SEGMENT_FADE_DURATION,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start();
        });
    }, [activeBackend]);

    return animationRef.current!;
};

const createOpacity = (value: Animated.Value, active: boolean) =>
    value.interpolate({
        inputRange: [0, 1],
        outputRange: active ? [0.68, 1] : [0.24, 0.8],
    });

const parseStackLine = (line: string): ParsedStackLine => {
    const atRegex = /^at\s+(.+?)(?:\s+\((.+)\))?$/;
    const atMatch = atRegex.exec(line);
    if (!atMatch) {
        return { component: line, location: '' };
    }

    const [, componentPart, locationPart] = atMatch;

    if (locationPart) {
        return { component: componentPart, location: locationPart };
    }

    const urlRegex = /^(.+?)\s+(https?:\/\/.+)$/;
    const urlMatch = urlRegex.exec(componentPart);
    if (urlMatch) {
        return { component: urlMatch[1], location: urlMatch[2] };
    }

    return { component: componentPart, location: '' };
};

const deriveStackLines = (stack?: string): ParsedStackLine[] =>
    stack
        ?.split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => parseStackLine(line)) ?? [];

const STACK_SCROLL_ID = 'error-fallback-stack';

const createWebDebugLogger = (label: string) => {
    const logValue = <Value,>(
        value: Value,
        context: Record<string, unknown> = {}
    ): Value => {
        console.log(`[ErrorFallback:${label}]`, value, context);
        return value;
    };

    return logValue;
};

const useGlowBackends = (glowScene: ReturnType<typeof buildGlowScene>) => {
    const debug = useMemo(() => createWebDebugLogger('backends'), []);
    const isWeb = Platform.OS === 'web';
    const { visibility, setVisibility } = useAnimationLayers();

    const webgpuAvailable = isWeb && hasWebGPU();
    const webglAvailable = isWeb && hasWebGL();

    const initialPreference = useMemo<GlowMode>(() => {
        if (webgpuAvailable) {
            return 'webgpu';
        }
        if (webglAvailable) {
            return 'webgl';
        }
        return 'css';
    }, [webglAvailable, webgpuAvailable]);

    const [preferredBackend, setPreferredBackend] =
        useState<GlowMode>(initialPreference);

    useEffect(() => {
        debug('capabilities:detected', {
            isWeb,
            webgpuAvailable,
            webglAvailable,
        });
        setPreferredBackend((current) => {
            const nextPreferred =
                current === 'webgpu' && !webgpuAvailable
                    ? webglAvailable
                        ? 'webgl'
                        : 'css'
                    : current === 'webgl' && !webglAvailable
                      ? webgpuAvailable
                          ? 'webgpu'
                          : 'css'
                      : current;
            if (nextPreferred !== current) {
                debug('preferred-backend:adjust', {
                    from: current,
                    to: nextPreferred,
                    webgpuAvailable,
                    webglAvailable,
                });
            } else {
                debug('preferred-backend:retain', {
                    current,
                });
            }
            return nextPreferred;
        });
    }, [debug, isWeb, webglAvailable, webgpuAvailable]);

    const availability = useMemo(
        () => ({
            webgpu: webgpuAvailable,
            webgl: webglAvailable,
            css: true,
        }),
        [webglAvailable, webgpuAvailable]
    );

    useEffect(() => {
        debug('availability:update', availability);
    }, [availability, debug]);

    const { containerStyle, layers, status } = renderAnimationScene(
        glowScene,
        isWeb
            ? {
                  visibility,
                  preferredBackend,
              }
            : undefined
    );

    const overlayLayers = useMemo(
        () =>
            isWeb
                ? layers.filter((layer) => layer.type !== 'dom')
                : ([] as SceneRenderLayer[]),
        [isWeb, layers]
    );

    const effectiveBackend: GlowMode = useMemo(() => {
        if (!isWeb) {
            return 'css';
        }
        if (preferredBackend === 'css') {
            return 'css';
        }
        if (!availability[preferredBackend]) {
            return 'css';
        }
        if (status === 'failed') {
            return 'css';
        }
        return preferredBackend;
    }, [availability, isWeb, preferredBackend, status]);

    useEffect(() => {
        debug('backend:status', {
            preferredBackend,
            effectiveBackend,
            status,
        });
        if (!isWeb) {
            return;
        }
        const wantsGpu = effectiveBackend !== 'css';
        debug('visibility:update', {
            wantsGpu,
        });
        setVisibility('gpu-glow', wantsGpu);
        setVisibility('css-glow', !wantsGpu);
    }, [
        debug,
        effectiveBackend,
        isWeb,
        preferredBackend,
        setVisibility,
        status,
    ]);

    const setBackend = useCallback(
        (mode: GlowMode) => {
            debug('set-backend:requested', {
                mode,
                available: availability[mode],
                currentPreferred: preferredBackend,
                currentEffective: effectiveBackend,
            });
            if (!availability[mode]) {
                debug('set-backend:rejected', {
                    mode,
                });
                return;
            }
            setPreferredBackend(mode);
            debug('set-backend:applied', {
                mode,
            });
        },
        [availability, debug, effectiveBackend, preferredBackend]
    );

    return {
        containerStyle,
        overlayLayers,
        availability,
        preferredBackend,
        activeBackend: effectiveBackend,
        setBackend,
        status,
        isWeb,
    };
};

const ErrorFallbackInner: React.FC<
    ErrorFallbackProps & {
        glowScene: ReturnType<typeof buildGlowScene>;
    }
> = ({ error, resetErrorBoundary, componentStack, onReset, glowScene }) => {
    const debug = useMemo(() => createWebDebugLogger('inner'), []);
    const { theme } = useTheme();
    const {
        containerStyle,
        overlayLayers,
        availability,
        preferredBackend,
        activeBackend,
        setBackend,
        status,
        isWeb,
    } = useGlowBackends(glowScene);
    const { width, height } = useWindowDimensions();
    const { ScrollbarStyles } = useThemedScrollbars();
    const { createNativeShadowStyle } = useAnimatedGlow(0.2, 0.5, 3000);
    const stackLines = useMemo(
        () => deriveStackLines(componentStack),
        [componentStack]
    );
    useEffect(() => {
        debug('component-stack', {
            hasStack: stackLines.length > 0,
            lineCount: stackLines.length,
        });
    }, [debug, stackLines]);
    const baseStyles = useMemo(() => createStyles(theme), [theme]);
    const { styles: responsiveStyles, shouldScroll } = useMemo(
        () => createResponsiveOverrides(width, height),
        [height, width]
    );
    useEffect(() => {
        debug('responsive-overrides', {
            shouldScroll,
        });
    }, [debug, shouldScroll]);

    const handleReset = () => {
        debug('handleReset:invoke', {
            hasOnReset: Boolean(onReset),
        });
        resetErrorBoundary();
        onReset?.();
    };

    const segments = useMemo(
        () => createSegmentDescriptors(availability, activeBackend),
        [availability, activeBackend]
    );

    const segmentAnimations = useSegmentAnimations(activeBackend);

    const segmentsNode = useMemo(() => {
        if (segments.length === 0) {
            return null;
        }
        return (
            <View style={baseStyles.segmentGroup}>
                <View style={baseStyles.segmentBackground}>
                    {segments.map((descriptor) => (
                        <Pressable
                            key={descriptor.mode}
                            accessibilityRole="button"
                            accessibilityHint={`Switch glow renderer to ${backendLabels[descriptor.mode]}`}
                            accessibilityState={{
                                disabled: descriptor.isDisabled,
                                selected: descriptor.active,
                            }}
                            onPress={() => setBackend(descriptor.mode)}
                            disabled={descriptor.isDisabled}
                            style={(pressableState) =>
                                createSegmentBoxStyles(
                                    baseStyles,
                                    descriptor,
                                    mapSegmentState(pressableState),
                                    createOpacity(
                                        segmentAnimations[descriptor.mode],
                                        descriptor.active
                                    )
                                )
                            }
                        >
                            {(pressableState) => (
                                <Animated.View
                                    style={[baseStyles.segmentContent]}
                                >
                                    <Animated.Text
                                        style={[
                                            baseStyles.segmentIcon,
                                            createSegmentLabelStyles(
                                                baseStyles,
                                                descriptor,
                                                mapSegmentState(pressableState)
                                            ),
                                            {
                                                opacity: createOpacity(
                                                    segmentAnimations[
                                                        descriptor.mode
                                                    ],
                                                    descriptor.active
                                                ),
                                            },
                                        ]}
                                    >
                                        {backendIcons[descriptor.mode]}
                                    </Animated.Text>
                                    <Animated.Text
                                        style={[
                                            baseStyles.segmentLabel,
                                            createSegmentLabelStyles(
                                                baseStyles,
                                                descriptor,
                                                mapSegmentState(pressableState)
                                            ),
                                            {
                                                opacity: createOpacity(
                                                    segmentAnimations[
                                                        descriptor.mode
                                                    ],
                                                    descriptor.active
                                                ),
                                            },
                                        ]}
                                    >
                                        {descriptor.label}
                                    </Animated.Text>
                                </Animated.View>
                            )}
                        </Pressable>
                    ))}
                </View>
            </View>
        );
    }, [baseStyles, segments, setBackend, segmentAnimations]);

    const cardContent = (
        <View style={[baseStyles.cardBody, responsiveStyles.cardBody]}>
            <View style={baseStyles.headerBlock}>
                <Text style={baseStyles.eyebrow}>ERROR</Text>
                <Text style={baseStyles.headerTitle}>Something Went Wrong</Text>
                <Text style={baseStyles.headerSubtitle}>
                    We ran into an unexpected issue while rendering the app.
                </Text>
            </View>
            <View style={baseStyles.firstSection}>
                <Text style={baseStyles.sectionLabel}>Error Message</Text>
                <View style={baseStyles.messageSurface}>
                    <Text style={baseStyles.messageText}>{error.message}</Text>
                </View>
            </View>
            {stackLines.length > 0 && (
                <View style={baseStyles.section}>
                    <Text style={baseStyles.sectionLabel}>Component Trace</Text>
                    {Platform.OS === 'web' && (
                        <NexusScrollView
                            nativeID={STACK_SCROLL_ID}
                            maxHeight={280}
                            style={{
                                borderRadius: BorderRadius.Medium,
                                backgroundColor: theme.colors.AppBackground,
                                borderWidth: 1,
                                borderColor: toRgba(
                                    theme.colors.ActiveText,
                                    0.08
                                ),
                            }}
                            contentContainerStyle={baseStyles.stackContent}
                        >
                            {stackLines.map((line, index) => (
                                <View
                                    key={`${index}-${line.component}`}
                                    style={baseStyles.stackLineWrapper}
                                >
                                    <Text style={baseStyles.stackComponent}>
                                        {line.component}
                                    </Text>
                                    {Boolean(line.location) && (
                                        <Text style={baseStyles.stackLocation}>
                                            {line.location}
                                        </Text>
                                    )}
                                </View>
                            ))}
                        </NexusScrollView>
                    )}
                </View>
            )}
            <View style={baseStyles.footer}>
                {Platform.OS === 'web' ? segmentsNode : null}
                <Pressable
                    onPress={handleReset}
                    style={({ pressed }) =>
                        pressed
                            ? baseStyles.primaryButtonPressed
                            : baseStyles.primaryButton
                    }
                >
                    <Text style={baseStyles.primaryButtonText}>
                        Reload Screen
                    </Text>
                </Pressable>
            </View>
        </View>
    );

    const scrollStyles = useMemo(() => {
        if (Platform.OS !== 'web') {
            return null;
        }
        return (
            <ScrollbarStyles
                targetSelector={`#${STACK_SCROLL_ID}, #error-fallback-scroll`}
            />
        );
    }, [ScrollbarStyles]);

    const cardBodyNode = shouldScroll ? (
        <NexusScrollView
            style={responsiveStyles.cardScroll}
            contentContainerStyle={responsiveStyles.cardScrollContent}
            nativeID="error-fallback-scroll"
        >
            {cardContent}
        </NexusScrollView>
    ) : (
        cardContent
    );
    useEffect(() => {
        debug('card-body-node', {
            hasScrollbar: shouldScroll,
            overlayLayerCount: overlayLayers.length,
        });
    }, [debug, overlayLayers, shouldScroll]);

    const layeredCard = (
        <View style={baseStyles.cardWrapper}>
            <View pointerEvents="none" style={baseStyles.overlayContainer}>
                {overlayLayers.length > 0 ? (
                    <View style={[baseStyles.overlayContent, containerStyle]}>
                        {overlayLayers.map((layer) => (
                            <LayerFragment key={layer.id} layer={layer} />
                        ))}
                    </View>
                ) : null}
            </View>
            <View style={[baseStyles.card, responsiveStyles.card]}>
                {cardBodyNode}
            </View>
        </View>
    );

    return (
        <View style={[baseStyles.backdrop, responsiveStyles.backdrop]}>
            {scrollStyles}
            {Platform.OS === 'web' ? (
                <View
                    style={[
                        baseStyles.shellContainer,
                        responsiveStyles.shellContainer,
                    ]}
                    nativeID="error-fallback-shell"
                >
                    <View style={[baseStyles.shell, responsiveStyles.shell]}>
                        {layeredCard}
                    </View>
                </View>
            ) : (
                <Animated.View
                    style={[
                        baseStyles.shellContainer,
                        responsiveStyles.shellContainer,
                        createNativeShadowStyle(theme.colors.Primary),
                    ]}
                >
                    <View style={[baseStyles.shell, responsiveStyles.shell]}>
                        <View style={[baseStyles.card, responsiveStyles.card]}>
                            {cardBodyNode}
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
};

export const ErrorFallback: React.FC<ErrorFallbackProps> = (props) => {
    const { theme } = useTheme();
    const glowScene = useMemo(
        () =>
            buildGlowScene({
                color: theme.colors.Primary,
                borderRadius: BorderRadius.Large,
                focal: { x: 0.5, y: 0.5 },
                opacity: 0.85,
                animate: true,
            }),
        [theme.colors.Primary]
    );

    if (Platform.OS === 'web') {
        return (
            <AnimationProvider scene={glowScene}>
                <ErrorFallbackInner {...props} glowScene={glowScene} />
            </AnimationProvider>
        );
    }
    return <ErrorFallbackInner {...props} glowScene={glowScene} />;
};

const LayerFragment: React.FC<{ layer: SceneRenderLayer }> = ({ layer }) => {
    if (!layer.element) {
        return null;
    }
    return <>{layer.element}</>;
};

const createStyles = (theme: Theme) =>
    StyleSheet.create({
        backdrop: {
            flex: 1,
            backgroundColor: theme.colors.AppBackground,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: Spacing.XXL,
            paddingVertical: Spacing.XXXL,
        },
        shellContainer: {
            width: '100%',
            maxWidth: 640,
            borderRadius: BorderRadius.ExtraLarge,
            alignSelf: 'center',
        },
        shell: {
            width: '100%',
            borderRadius: BorderRadius.ExtraLarge,
            padding: Spacing.XS,
            backgroundColor: theme.colors.TertiaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.05),
        },
        cardWrapper: {
            position: 'relative',
            borderRadius: BorderRadius.Large,
            overflow: 'visible',
        },
        card: {
            width: '100%',
            borderRadius: BorderRadius.Large,
            backgroundColor: theme.colors.SecondaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.05),
        },
        overlayContainer: {
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            overflow: 'visible',
        },
        overlayContent: {
            width: '100%',
            height: '100%',
            position: 'relative',
            overflow: 'visible',
        },
        cardBody: {
            padding: Spacing.XXXL,
        },
        headerBlock: {
            marginBottom: 0,
        },
        eyebrow: {
            ...Typography.Eyebrow,
            color: toRgba(theme.colors.ActiveText, 0.6),
            fontFamily:
                theme.fonts.secondary?.semibold ?? theme.fonts.secondary?.bold,
            marginBottom: Spacing.SM,
        },
        headerTitle: {
            ...Typography.H2,
            color: theme.colors.ActiveText,
            fontFamily: theme.fonts.primary?.bold,
        },
        headerSubtitle: {
            ...Typography.Body,
            color: theme.colors.MainText,
            marginTop: Spacing.SM,
        },
        firstSection: {
            marginTop: Spacing.XL,
        },
        section: {
            marginTop: Spacing.XXL,
        },
        sectionLabel: {
            ...Typography.SectionHeading,
            color: theme.colors.MainText,
            fontFamily:
                theme.fonts.primary?.semibold ?? theme.fonts.primary?.bold,
            marginBottom: Spacing.MD,
        },
        messageSurface: {
            borderRadius: BorderRadius.Medium,
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.LG,
            backgroundColor: theme.colors.TertiaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.04),
        },
        messageText: {
            ...Typography.Body,
            color: theme.colors.ActiveText,
            fontFamily: theme.fonts.primary?.regular,
        },
        stackSurface: {
            borderRadius: BorderRadius.Medium,
            backgroundColor: theme.colors.AppBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.08),
        },
        stackScroll: {
            maxHeight: 280,
        },
        stackContent: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            ...(Platform.OS === 'web' && {
                clipPath: `inset(0 round ${BorderRadius.Medium}px)`,
            }),
        },
        stackLineWrapper: {
            paddingVertical: Spacing.SM - 2,
            borderBottomWidth: 1,
            borderBottomColor: toRgba(theme.colors.ActiveText, 0.03),
        },
        stackComponent: {
            ...Typography.Code,
            fontFamily:
                theme.fonts.monospace?.semibold ??
                theme.fonts.monospace?.bold ??
                Platform.select({
                    web: 'monospace',
                    default: 'Courier',
                }),
            fontWeight: '600',
            color: theme.colors.ActiveText,
            marginBottom: 2,
        },
        stackLocation: {
            fontFamily:
                theme.fonts.monospace?.regular ??
                Platform.select({
                    web: 'monospace',
                    default: 'Courier',
                }),
            fontSize: Typography.Eyebrow.fontSize,
            color: theme.colors.MainText,
            opacity: 0.5,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            marginTop: Spacing.XXXL,
            gap: Spacing.MD,
        },
        primaryButton: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: theme.colors.Primary,
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.08),
        },
        primaryButtonPressed: {
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.MD,
            backgroundColor: theme.colors.Secondary,
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.08),
        },
        secondaryButton: {
            marginRight: Spacing.MD,
            paddingHorizontal: Spacing.LG,
            paddingVertical: Spacing.SM,
            backgroundColor: toRgba(theme.colors.Primary, 0.12),
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.Primary, 0.3),
        },
        secondaryButtonPressed: {
            marginRight: Spacing.MD,
            paddingHorizontal: Spacing.LG,
            paddingVertical: Spacing.SM,
            backgroundColor: toRgba(theme.colors.Primary, 0.2),
            borderRadius: BorderRadius.Pill,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.Primary, 0.4),
        },
        secondaryButtonText: {
            ...Typography.Button,
            color: theme.colors.Primary,
            fontFamily:
                theme.fonts.primary?.semibold ?? theme.fonts.primary?.bold,
        },
        primaryButtonText: {
            ...Typography.Button,
            color: theme.colors.ActiveText,
            fontFamily:
                theme.fonts.primary?.semibold ?? theme.fonts.primary?.bold,
        },
        segmentGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            height: SEGMENT_HEIGHT,
            borderRadius: SEGMENT_HEIGHT / 2,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
            backgroundColor: toRgba(theme.colors.ActiveText, 0.06),
            padding: 2,
        },
        segmentBackground: {
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: SEGMENT_HEIGHT / 2,
            paddingHorizontal: 2,
        },
        segment: {
            borderRadius: SEGMENT_HEIGHT / 2,
            minWidth: 90,
            paddingHorizontal: SEGMENT_HORIZONTAL_PADDING,
            height: SEGMENT_HEIGHT - 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.08),
            marginHorizontal: 2,
        },
        segmentContent: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.SM,
        },
        segmentIcon: {
            ...Typography.BodySmall,
            color: toRgba(theme.colors.ActiveText, 0.55),
        },
        segmentActive: {
            backgroundColor: toRgba(theme.colors.Primary, 0.14),
            borderColor: toRgba(theme.colors.Primary, 0.45),
            shadowColor: theme.colors.Primary,
            shadowOpacity: 0.28,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 1 },
        },
        segmentHovered: {
            borderColor: toRgba(theme.colors.Primary, 0.35),
        },
        segmentPressed: {
            backgroundColor: toRgba(theme.colors.Primary, 0.08),
        },
        segmentFocused: {
            borderColor: toRgba(theme.colors.Primary, 0.5),
            shadowColor: theme.colors.Primary,
            shadowOpacity: 0.36,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
        },
        segmentDisabled: {
            opacity: 0.45,
        },
        segmentLabel: {
            ...Typography.BodySmall,
            color: toRgba(theme.colors.ActiveText, 0.62),
            fontFamily:
                theme.fonts.monospace?.semibold ??
                theme.fonts.monospace?.bold ??
                theme.fonts.primary?.semibold ??
                theme.fonts.primary?.bold,
            letterSpacing: 0.6,
        },
        segmentLabelActive: {
            color: theme.colors.ActiveText,
        },
        segmentLabelHovered: {
            color: lightenColor(theme.colors.ActiveText, 0.12),
        },
        segmentLabelPressed: {
            color: lightenColor(theme.colors.ActiveText, 0.08),
        },
        segmentLabelFocused: {
            color: theme.colors.ActiveText,
        },
        segmentLabelDisabled: {
            color: toRgba(theme.colors.ActiveText, 0.42),
        },
    });

const createResponsiveOverrides = (width: number, height: number) => {
    const isSmallWidth = width < 768;
    const isSmallHeight = height < 720;

    const horizontalPadding = isSmallWidth ? Spacing.XL : Spacing.XXL;
    const verticalPadding = isSmallHeight ? Spacing.XL : Spacing.XXXL;
    const availableWidth = Math.max(
        width - horizontalPadding * 2,
        Spacing.XL * 3
    );

    const cardPadding = isSmallWidth ? Spacing.XXL : Spacing.XXXL;

    const styles = StyleSheet.create({
        backdrop: {
            paddingHorizontal: horizontalPadding,
            paddingVertical: verticalPadding,
        },
        shellContainer: {
            maxWidth: Math.min(availableWidth, 640),
            marginVertical: isSmallHeight ? Spacing.LG : 0,
        },
        shell: {
            maxHeight: isSmallHeight
                ? Math.max(height - verticalPadding * 2, Spacing.XXL * 2)
                : undefined,
        },
        card: {
            maxHeight: isSmallHeight
                ? Math.max(
                      height - verticalPadding * 2 - Spacing.LG,
                      Spacing.XXL * 2
                  )
                : undefined,
        },
        cardBody: {
            padding: cardPadding,
        },
        cardScroll: {
            flexGrow: 0,
        },
        cardScrollContent: {
            padding: cardPadding,
        },
    });

    return {
        styles,
        shouldScroll: isSmallHeight,
    };
};
