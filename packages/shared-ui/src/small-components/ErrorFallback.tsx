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
    type LayoutChangeEvent,
    type LayoutRectangle,
    type PressableStateCallbackType,
} from 'react-native';

import { useTheme } from '../theme';
import { toRgba } from '../utils';
import { useAnimatedGlow } from '../hooks';
import type { Theme } from '../theme';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';
import { useThemedScrollbars, NexusScrollView } from '../styles';
import { AnimationProvider } from '../providers/AnimationProvider';
import {
    Glow,
    hasWebGPU,
    hasWebGL,
    type GlowBackend,
    type GlowDiagnostics,
    type GlowStatus,
} from '../effects/glow';

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

type GlowMode = GlowBackend;
type GlowSegmentBackend = 'webgpu' | 'webgl' | 'css';

const SEGMENT_HEIGHT = 36;
const SEGMENT_HORIZONTAL_PADDING = 10;
const SEGMENT_HORIZONTAL_MARGIN = 0;
const SEGMENT_TRACK_PADDING = 2;
const SEGMENT_FADE_DURATION = 160;
const backendOrder: ReadonlyArray<GlowSegmentBackend> = [
    'webgpu',
    'webgl',
    'css',
];
const backendLabels: Record<GlowSegmentBackend | 'auto', string> = {
    webgpu: 'WebGPU',
    webgl: 'WebGL',
    css: 'CSS',
    auto: 'Auto',
};
const backendIcons: Record<GlowSegmentBackend, string> = {
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
    readonly mode: GlowSegmentBackend;
    readonly label: string;
    readonly available: boolean;
    readonly active: boolean;
    readonly isDisabled: boolean;
    readonly failed: boolean;
};

const createSegmentDescriptors = (
    availability: Record<GlowSegmentBackend, boolean>,
    activeBackend: string,
    failedBackends: ReadonlySet<string>
) =>
    backendOrder.map<SegmentDescriptor>((mode) => ({
        mode,
        label: backendLabels[mode],
        available: availability[mode],
        active: activeBackend === mode,
        isDisabled: !availability[mode],
        failed: failedBackends.has(mode),
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
    descriptor.failed && styles.segmentFailed,
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
    descriptor.failed && styles.segmentLabelFailed,
    state.hovered && !descriptor.isDisabled && styles.segmentLabelHovered,
    state.pressed && !descriptor.isDisabled && styles.segmentLabelPressed,
    state.focused && styles.segmentLabelFocused,
];

const mapSegmentState = (state: PressableStateCallbackType) => ({
    hovered: Boolean(state.hovered),
    pressed: Boolean(state.pressed),
    focused: Boolean(state.focused),
});

const createSegmentAnimations = (activeBackend: GlowSegmentBackend) =>
    backendOrder.reduce<Record<GlowSegmentBackend, Animated.Value>>(
        (accumulator, mode) => ({
            ...accumulator,
            [mode]: new Animated.Value(mode === activeBackend ? 1 : 0),
        }),
        {} as Record<GlowSegmentBackend, Animated.Value>
    );

const useSegmentAnimations = (activeBackend: string) => {
    const animationRef = useRef<Record<
        GlowSegmentBackend,
        Animated.Value
    > | null>(null);
    animationRef.current ??= createSegmentAnimations(
        activeBackend as GlowSegmentBackend
    );

    useEffect(() => {
        const animations = animationRef.current;
        if (!animations) {
            return;
        }
        backendOrder.forEach((mode) => {
            Animated.timing(animations[mode], {
                toValue: mode === activeBackend ? 1 : 0,
                duration: SEGMENT_FADE_DURATION,
                easing: Easing.out(Easing.quad),
                useNativeDriver: false,
            }).start();
        });
    }, [activeBackend]);

    return animationRef.current;
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
        // eslint-disable-next-line no-console
        console.log(`[ErrorFallback:${label}]`, value, context);
        return value;
    };

    return logValue;
};

const useGlowState = () => {
    const isWeb = Platform.OS === 'web';
    const webgpuAvailable = isWeb && hasWebGPU();
    const webglAvailable = isWeb && hasWebGL();

    const [preferredBackend, setPreferredBackend] = useState<GlowMode>('auto');
    const [activeBackend, setActiveBackend] = useState<string>('css');
    const [status, setStatus] = useState<GlowStatus>('initializing');
    const [diagnostics, setDiagnostics] = useState<GlowDiagnostics>({
        failedBackends: [],
        backendErrors: {},
        attemptedBackends: [],
    });
    const [rendererLocked, setRendererLocked] = useState(true);

    const availability = useMemo(
        () => ({
            webgpu: webgpuAvailable,
            webgl: webglAvailable,
            css: true,
        }),
        [webglAvailable, webgpuAvailable]
    );

    const setBackend = useCallback(
        (mode: GlowMode) => {
            if (mode === 'auto') {
                setPreferredBackend('auto');
                return;
            }
            if (!availability[mode]) {
                return;
            }
            setPreferredBackend(mode);
        },
        [availability]
    );

    return {
        availability,
        preferredBackend,
        activeBackend,
        status,
        diagnostics,
        setBackend,
        setActiveBackend,
        setStatus,
        setDiagnostics,
        isWeb,
        rendererLocked,
        setRendererLocked,
    };
};

const ErrorFallbackInner: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
    componentStack,
    onReset,
}) => {
    const debug = useMemo(() => createWebDebugLogger('inner'), []);
    const { theme } = useTheme();
    const {
        availability,
        preferredBackend,
        activeBackend,
        diagnostics,
        setBackend,
        setActiveBackend,
        setStatus,
        setDiagnostics,
        isWeb,
        rendererLocked,
        setRendererLocked,
    } = useGlowState();
    const { width, height } = useWindowDimensions();
    const { ScrollbarStyles } = useThemedScrollbars();
    const switchTranslate = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(switchTranslate, {
            toValue: rendererLocked ? 1 : 0,
            duration: 120,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [rendererLocked, switchTranslate]);

    const knobTranslateX = useMemo(
        () =>
            switchTranslate.interpolate({
                inputRange: [0, 1],
                outputRange: [3, 23],
            }),
        [switchTranslate]
    );
    // New: single-pill renderer state for sliding thumb
    const [segmentTrackWidth, setSegmentTrackWidth] = useState<number>(0);
    const thumbTranslate = useRef(new Animated.Value(0)).current;
    const thumbWidth = useRef(new Animated.Value(0)).current;
    const segmentMetrics = useRef<Record<GlowSegmentBackend, LayoutRectangle>>(
        {}
    );
    const lastActiveMode = useRef<GlowSegmentBackend | null>(null);

    const snapThumbTo = useCallback(
        (mode: GlowSegmentBackend) => {
            const metrics = segmentMetrics.current[mode];
            if (!metrics) {
                return false;
            }
            const xOffset = Math.max(0, metrics.x - SEGMENT_TRACK_PADDING);
            thumbTranslate.setValue(xOffset);
            thumbWidth.setValue(metrics.width);
            lastActiveMode.current = mode;
            return true;
        },
        [thumbTranslate, thumbWidth]
    );

    const animateThumbTo = useCallback(
        (mode: GlowSegmentBackend) => {
            const metrics = segmentMetrics.current[mode];
            if (!metrics) {
                return false;
            }
            const xOffset = Math.max(0, metrics.x - SEGMENT_TRACK_PADDING);
            Animated.parallel([
                Animated.timing(thumbTranslate, {
                    toValue: xOffset,
                    duration: 180,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(thumbWidth, {
                    toValue: metrics.width,
                    duration: 180,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                }),
            ]).start(() => {
                lastActiveMode.current = mode;
            });
            return true;
        },
        [thumbTranslate, thumbWidth]
    );
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

    const toggleRendererLock = useCallback(() => {
        setRendererLocked((current) => !current);
    }, [setRendererLocked]);

    const failedBackends = useMemo(() => {
        if (!diagnostics) {
            return new Set<string>();
        }
        return diagnostics.failedBackends.reduce<Set<string>>(
            (accumulator, backend) => {
                accumulator.add(backend);
                return accumulator;
            },
            new Set<string>()
        );
    }, [diagnostics]);

    const segments = useMemo(
        () =>
            createSegmentDescriptors(
                availability,
                activeBackend === 'auto' ? 'css' : activeBackend,
                failedBackends
            ),
        [availability, activeBackend, failedBackends]
    );

    const segmentAnimations = useSegmentAnimations(activeBackend);

    // Minimal single-pill renderer with sliding thumb behind active option
    useEffect(() => {
        const active = (
            activeBackend === 'auto' ? 'css' : activeBackend
        ) as GlowSegmentBackend;
        if (lastActiveMode.current === null) {
            snapThumbTo(active);
            return;
        }
        if (lastActiveMode.current === active) {
            return;
        }
        if (!animateThumbTo(active)) {
            lastActiveMode.current = active;
        }
    }, [activeBackend, animateThumbTo, snapThumbTo]);

    const segmentsNode = useMemo(() => {
        if (segments.length === 0 || !segmentAnimations) {
            return null;
        }
        return (
            <View
                style={baseStyles.segmentGroup}
                onLayout={(event: LayoutChangeEvent) => {
                    setSegmentTrackWidth(event.nativeEvent.layout.width);
                    if (
                        lastActiveMode.current === null &&
                        segments.length > 0
                    ) {
                        const activeMode = (
                            activeBackend === 'auto' ? 'css' : activeBackend
                        ) as GlowSegmentBackend;
                        snapThumbTo(activeMode);
                    }
                }}
            >
                <View style={baseStyles.segmentBackground}>
                    {segments.length > 0 ? (
                        <Animated.View
                            style={{
                                position: 'absolute',
                                top: SEGMENT_TRACK_PADDING,
                                left: SEGMENT_TRACK_PADDING,
                                height:
                                    SEGMENT_HEIGHT - SEGMENT_TRACK_PADDING * 2,
                                width: thumbWidth,
                                borderRadius:
                                    (SEGMENT_HEIGHT -
                                        SEGMENT_TRACK_PADDING * 2) /
                                    2,
                                backgroundColor: toRgba(
                                    theme.colors.Primary,
                                    0.18
                                ),
                                transform: [{ translateX: thumbTranslate }],
                            }}
                        />
                    ) : null}
                    {segments.map((descriptor, index) => (
                        <Pressable
                            key={descriptor.mode}
                            accessibilityRole="button"
                            accessibilityHint={`Switch glow renderer to ${backendLabels[descriptor.mode]}`}
                            accessibilityState={{
                                disabled: descriptor.isDisabled,
                                selected: descriptor.active,
                            }}
                            onPress={() => {
                                setBackend(descriptor.mode as GlowMode);
                                animateThumbTo(descriptor.mode);
                            }}
                            onLayout={(event: LayoutChangeEvent) => {
                                const { layout } = event.nativeEvent;
                                segmentMetrics.current[descriptor.mode] =
                                    layout;
                                if (
                                    lastActiveMode.current === null &&
                                    descriptor.active
                                ) {
                                    snapThumbTo(descriptor.mode);
                                }
                            }}
                            disabled={descriptor.isDisabled}
                            style={(pressableState) => [
                                ...createSegmentBoxStyles(
                                    baseStyles,
                                    descriptor,
                                    mapSegmentState(pressableState),
                                    createOpacity(
                                        segmentAnimations[descriptor.mode],
                                        descriptor.active
                                    )
                                ),
                                pressableState.pressed
                                    ? { transform: [{ scale: 0.98 }] }
                                    : {},
                            ]}
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
    }, [
        segments,
        segmentAnimations,
        baseStyles,
        segmentTrackWidth,
        thumbTranslate,
        theme.colors.Primary,
        setBackend,
    ]);

    const rendererControls = useMemo(() => {
        if (!isWeb || !segmentsNode) {
            return null;
        }

        return (
            <View style={baseStyles.lockRow}>
                <View style={baseStyles.segmentWrapper}>{segmentsNode}</View>
                <View
                    style={[
                        baseStyles.lockTogglePanel,
                        {
                            width:
                                segmentTrackWidth > 0
                                    ? segmentTrackWidth
                                    : undefined,
                        },
                    ]}
                >
                    <Text
                        style={[
                            baseStyles.lockToggleLabel,
                            { opacity: rendererLocked ? 1 : 0.8 },
                        ]}
                    >
                        Lock Renderer
                    </Text>
                    <View style={baseStyles.lockToggleGroup}>
                        <Pressable onPress={toggleRendererLock}>
                            <View
                                style={[
                                    baseStyles.switchTrack,
                                    rendererLocked &&
                                        baseStyles.switchTrackActive,
                                ]}
                            >
                                <Animated.View
                                    style={[
                                        baseStyles.switchKnob,
                                        rendererLocked &&
                                            baseStyles.switchKnobActive,
                                        {
                                            transform: [
                                                { translateX: knobTranslateX },
                                            ],
                                        },
                                    ]}
                                />
                            </View>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }, [
        baseStyles.lockRow,
        baseStyles.lockToggleGroup,
        baseStyles.lockToggleLabel,
        baseStyles.lockTogglePanel,
        baseStyles.segmentWrapper,
        isWeb,
        rendererLocked,
        segmentsNode,
        toggleRendererLock,
        knobTranslateX,
        baseStyles.switchTrack,
        baseStyles.switchTrackActive,
        baseStyles.switchKnob,
        baseStyles.switchKnobActive,
        segmentTrackWidth,
    ]);

    const diagnosticsNotice = useMemo(() => {
        if (!diagnostics || diagnostics.failedBackends.length === 0) {
            return null;
        }
        const summary = diagnostics.failedBackends.reduce<{
            lastBackend: string | null;
            lastMessage: string | null;
            cssActivated: boolean;
            details: ReadonlyArray<string>;
        }>(
            (accumulator, backend) => {
                const isGpuBackend =
                    backend === 'webgpu' || backend === 'webgl';
                const backendError = diagnostics.backendErrors[backend];
                const nextMessage =
                    backendError?.message ?? 'Renderer initialization failed';
                const detailLines = (() => {
                    const meta = (
                        backendError as Error & {
                            readonly details?: ReadonlyArray<string>;
                        }
                    )?.details;
                    return Array.isArray(meta) ? meta : [];
                })();
                const mergedDetails =
                    detailLines.length > 0 ? detailLines : accumulator.details;
                return {
                    lastBackend: backend,
                    lastMessage: nextMessage,
                    cssActivated:
                        accumulator.cssActivated ||
                        backend === 'css' ||
                        !isGpuBackend,
                    details: mergedDetails,
                };
            },
            {
                lastBackend: null,
                lastMessage: null,
                cssActivated: false,
                details: [],
            }
        );
        if (!summary.lastBackend || !summary.lastMessage) {
            return null;
        }
        return {
            backend:
                backendLabels[summary.lastBackend as GlowMode] ??
                summary.lastBackend,
            message: summary.lastMessage,
            severity: summary.cssActivated
                ? ('error' as const)
                : ('warning' as const),
            details: summary.details,
        };
    }, [diagnostics]);

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
                <View style={{ flex: 1, alignItems: 'center' }}>
                    {rendererControls}
                </View>
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
            {diagnosticsNotice ? (
                <View
                    style={[
                        baseStyles.diagnosticsBanner,
                        diagnosticsNotice.severity === 'error'
                            ? baseStyles.diagnosticsBannerError
                            : baseStyles.diagnosticsBannerWarning,
                    ]}
                >
                    <Text style={baseStyles.diagnosticsLabel}>
                        {`Renderer fallback to ${diagnosticsNotice.backend}`}
                    </Text>
                    <Text style={baseStyles.diagnosticsMessage}>
                        {diagnosticsNotice.message}
                    </Text>
                    {diagnosticsNotice.details?.length ? (
                        <View style={baseStyles.diagnosticsDetails}>
                            {diagnosticsNotice.details.map((line, index) => (
                                <Text
                                    key={`${line}-${index}`}
                                    style={baseStyles.diagnosticsDetailLine}
                                >
                                    {line}
                                </Text>
                            ))}
                        </View>
                    ) : null}
                </View>
            ) : null}
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
            maxHeight="100vh"
        >
            {cardContent}
        </NexusScrollView>
    ) : (
        cardContent
    );
    const layeredCard = (
        <View style={baseStyles.cardWrapper}>
            {isWeb && (
                <View pointerEvents="none" style={baseStyles.overlayContainer}>
                    <Glow
                        color={theme.colors.Primary}
                        borderRadius={BorderRadius.Large}
                        focal={{ x: 0.5, y: 0.5 }}
                        opacity={0.85}
                        animate
                        preferredBackend={preferredBackend}
                        fallbackBehavior={
                            rendererLocked ? 'locked' : 'adaptive'
                        }
                        onBackendChange={setActiveBackend}
                        onStatusChange={setStatus}
                        onDiagnosticsChange={setDiagnostics}
                    />
                </View>
            )}
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
    if (Platform.OS === 'web') {
        return (
            <AnimationProvider>
                <ErrorFallbackInner {...props} />
            </AnimationProvider>
        );
    }
    return <ErrorFallbackInner {...props} />;
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
            minHeight: 0,
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
            alignItems: 'center',
            marginTop: Spacing.XXXL,
            gap: Spacing.MD,
        },
        lockRow: {
            flexDirection: 'column',
            alignItems: 'center',
            gap: Spacing.MD,
            width: '100%',
        },
        lockTogglePanel: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            alignSelf: 'center',
            gap: Spacing.LG,
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.SM,
            borderRadius: BorderRadius.Pill,
            backgroundColor: toRgba(theme.colors.ActiveText, 0.08),
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.12),
            width: '100%',
            maxWidth: 320,
        },
        lockToggleGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.SM,
        },
        lockToggleLabel: {
            ...Typography.BodySmall,
            color: toRgba(theme.colors.MainText, 0.82),
            fontFamily:
                theme.fonts.primary?.semibold ?? theme.fonts.primary?.bold,
        },
        segmentWrapper: {
            flexShrink: 1,
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex',
            paddingHorizontal: Spacing.XL,
        },
        diagnosticsBanner: {
            marginTop: Spacing.XXL,
            borderRadius: BorderRadius.Medium,
            paddingHorizontal: Spacing.XL,
            paddingVertical: Spacing.LG,
            gap: Spacing.SM,
        },
        diagnosticsBannerWarning: {
            backgroundColor: toRgba(theme.colors.Primary, 0.08),
            borderWidth: 1,
            borderColor: toRgba(theme.colors.Primary, 0.22),
        },
        diagnosticsBannerError: {
            backgroundColor: toRgba(theme.colors.Secondary, 0.12),
            borderWidth: 1,
            borderColor: toRgba(theme.colors.Secondary, 0.3),
        },
        diagnosticsLabel: {
            ...Typography.Button,
            color: theme.colors.ActiveText,
            fontFamily:
                theme.fonts.primary?.semibold ?? theme.fonts.primary?.bold,
            textTransform: 'uppercase',
        },
        diagnosticsMessage: {
            ...Typography.BodySmall,
            color: toRgba(theme.colors.MainText, 0.84),
            fontFamily: theme.fonts.primary?.regular,
        },
        diagnosticsDetails: {
            marginTop: Spacing.SM,
            paddingHorizontal: Spacing.SM,
            paddingVertical: Spacing.XS,
            backgroundColor: toRgba(theme.colors.ActiveText, 0.06),
            borderRadius: BorderRadius.Small,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.1),
        },
        diagnosticsDetailLine: {
            ...Typography.BodySmall,
            color: toRgba(theme.colors.MainText, 0.7),
            fontFamily: theme.fonts.primary?.regular,
            lineHeight:
                Typography.BodySmall.lineHeight ??
                Typography.BodySmall.fontSize * 1.4,
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
            justifyContent: 'center',
            alignSelf: 'center',
            height: SEGMENT_HEIGHT,
            borderRadius: SEGMENT_HEIGHT / 2,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.08),
            backgroundColor: theme.colors.TertiaryBackground,
            padding: SEGMENT_TRACK_PADDING,
        },
        segmentBackground: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            borderRadius: SEGMENT_HEIGHT / 2,
            padding: SEGMENT_TRACK_PADDING,
        },
        segment: {
            minWidth: 90,
            paddingHorizontal: SEGMENT_HORIZONTAL_PADDING,
            height: SEGMENT_HEIGHT - 4,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: SEGMENT_HORIZONTAL_MARGIN,
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
            // Tweak active state for underline approach
        },
        segmentHovered: {
            // Tweak hover state for underline approach
        },
        segmentPressed: {
            // Handled with transform now
        },
        segmentFocused: {
            borderColor: toRgba(theme.colors.Primary, 0.5),
            borderRadius: BorderRadius.Medium,
            shadowColor: theme.colors.Primary,
            shadowOpacity: 0.36,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
        },
        segmentDisabled: {
            opacity: 0.45,
        },
        segmentFailed: {
            // No visual change for failed state in underline design
        },
        segmentLabel: {
            ...Typography.BodySmall,
            color: toRgba(theme.colors.ActiveText, 0.8),
            fontFamily:
                theme.fonts.monospace?.semibold ??
                theme.fonts.monospace?.bold ??
                theme.fonts.primary?.semibold ??
                theme.fonts.primary?.bold,
            letterSpacing: 0.6,
            textTransform: 'capitalize',
        },
        segmentLabelActive: {
            color: theme.colors.ActiveText,
        },
        segmentLabelHovered: {
            color: theme.colors.ActiveText,
        },
        segmentLabelPressed: {
            color: theme.colors.ActiveText,
        },
        segmentLabelFocused: {
            color: theme.colors.ActiveText,
        },
        segmentLabelDisabled: {
            color: toRgba(theme.colors.ActiveText, 0.42),
        },
        segmentLabelFailed: {
            color: toRgba(theme.colors.Secondary, 0.85),
        },
        switchTrack: {
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.TertiaryBackground,
            justifyContent: 'center',
        },
        switchTrackActive: {
            backgroundColor: toRgba(theme.colors.Primary, 0.28),
        },
        switchKnob: {
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: theme.colors.AppBackground,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 1,
        },
        switchKnobActive: {
            backgroundColor: theme.colors.Primary,
        },
    });

const MAX_MODAL_HEIGHT = 720;

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

    const naturalShellHeight = height - verticalPadding * 2;
    const maxModalHeight = Math.min(naturalShellHeight, MAX_MODAL_HEIGHT);
    const clampShell = Number.isFinite(maxModalHeight) && maxModalHeight > 0;

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
            maxHeight: clampShell
                ? Math.max(maxModalHeight, Spacing.XXL * 2)
                : undefined,
        },
        card: {
            maxHeight: clampShell
                ? Math.max(maxModalHeight - Spacing.LG, Spacing.XXL * 2)
                : undefined,
        },
        cardBody: {
            padding: cardPadding,
        },
        cardScroll: {
            flexGrow: 0,
            flexShrink: 1,
            minHeight: 0,
            maxHeight: clampShell
                ? Math.max(maxModalHeight - Spacing.LG, Spacing.XXL * 2)
                : undefined,
        },
        cardScrollContent: {
            padding: cardPadding,
        },
    });

    return {
        styles,
        shouldScroll: clampShell,
    };
};
