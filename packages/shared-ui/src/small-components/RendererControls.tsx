import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Animated,
    Easing,
    Pressable,
    Text,
    View,
    type LayoutChangeEvent,
    type LayoutRectangle,
    type PressableStateCallbackType,
} from 'react-native';

import { BorderRadius, Spacing, Typography } from '../constants/designSystem';
import { toRgba } from '../utils';
import type { Theme } from '../theme';
import type {
    RendererBackend,
    RendererDiagnostics,
    UseRendererControlResult,
} from '../hooks/useRendererControl';

const SEGMENT_HEIGHT = 36;
const SEGMENT_HORIZONTAL_PADDING = 10;
const SEGMENT_HORIZONTAL_MARGIN = 0;
const SEGMENT_TRACK_PADDING = 2;
const SEGMENT_FADE_DURATION = 160;

type SegmentState = {
    readonly hovered: boolean;
    readonly pressed: boolean;
    readonly focused: boolean;
};

type SegmentDescriptor<Backend extends RendererBackend> = {
    readonly mode: Backend;
    readonly label: string;
    readonly available: boolean;
    readonly active: boolean;
    readonly isDisabled: boolean;
    readonly failed: boolean;
};

const mapSegmentState = (state: PressableStateCallbackType): SegmentState => ({
    hovered: Boolean(state.hovered),
    pressed: Boolean(state.pressed),
    focused: Boolean(state.focused),
});

const createSegmentAnimations = <Backend extends RendererBackend>(
    backendOrder: ReadonlyArray<Backend>,
    activeBackend: Backend
) =>
    backendOrder.reduce<Record<Backend, Animated.Value>>(
        (accumulator, mode) => ({
            ...accumulator,
            [mode]: new Animated.Value(mode === activeBackend ? 1 : 0),
        }),
        {} as Record<Backend, Animated.Value>
    );

const useSegmentAnimations = <Backend extends RendererBackend>(
    backendOrder: ReadonlyArray<Backend>,
    activeBackend: Backend
) => {
    const animationRef = useRef<Record<Backend, Animated.Value> | null>(null);
    animationRef.current ??= createSegmentAnimations(
        backendOrder,
        activeBackend
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
    }, [activeBackend, backendOrder]);

    return animationRef.current;
};

const createOpacity = (value: Animated.Value, active: boolean) =>
    value.interpolate({
        inputRange: [0, 1],
        outputRange: active ? [0.68, 1] : [0.24, 0.8],
    });

const createSegmentBoxStyles = <Backend extends RendererBackend>(
    styles: ReturnType<typeof createStyles>,
    descriptor: SegmentDescriptor<Backend>,
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

const createSegmentLabelStyles = <Backend extends RendererBackend>(
    styles: ReturnType<typeof createStyles>,
    descriptor: SegmentDescriptor<Backend>,
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

type RendererControlsProps<Backend extends RendererBackend> = {
    readonly control: UseRendererControlResult<Backend>;
    readonly backendOrder: ReadonlyArray<Backend>;
    readonly backendLabels: Record<Backend | 'auto', string>;
    readonly backendIcons?: Partial<Record<Backend, string>>;
    readonly diagnostics?: RendererDiagnostics;
    readonly theme: Theme;
    readonly activeBackend: Backend;
    readonly lockLabel?: string;
};

const createStyles = (theme: Theme) => ({
    lockRow: {
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
        gap: Spacing.MD,
        width: '100%' as const,
    },
    segmentWrapper: {
        flexShrink: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        display: 'flex',
        paddingHorizontal: Spacing.XL,
    },
    segmentGroup: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        alignSelf: 'center' as const,
        height: SEGMENT_HEIGHT,
        borderRadius: SEGMENT_HEIGHT / 2,
        borderWidth: 1,
        borderColor: toRgba(theme.colors.ActiveText, 0.08),
        backgroundColor: theme.colors.TertiaryBackground,
        padding: SEGMENT_TRACK_PADDING,
    },
    segmentBackground: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        alignSelf: 'center' as const,
        borderRadius: SEGMENT_HEIGHT / 2,
        padding: SEGMENT_TRACK_PADDING,
    },
    segment: {
        minWidth: 90,
        paddingHorizontal: SEGMENT_HORIZONTAL_PADDING,
        height: SEGMENT_HEIGHT - 4,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginHorizontal: SEGMENT_HORIZONTAL_MARGIN,
    },
    segmentContent: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: Spacing.SM,
    },
    segmentIcon: {
        ...Typography.BodySmall,
        color: toRgba(theme.colors.ActiveText, 0.55),
    },
    segmentActive: {},
    segmentHovered: {},
    segmentPressed: {},
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
    segmentFailed: {},
    segmentLabel: {
        ...Typography.BodySmall,
        color: toRgba(theme.colors.ActiveText, 0.8),
        fontFamily:
            theme.fonts.monospace?.semibold ??
            theme.fonts.monospace?.bold ??
            theme.fonts.primary?.semibold ??
            theme.fonts.primary?.bold,
        letterSpacing: 0.6,
        textTransform: 'capitalize' as const,
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
    lockTogglePanel: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        alignSelf: 'center' as const,
        gap: Spacing.LG,
        paddingHorizontal: Spacing.XL,
        paddingVertical: Spacing.SM,
        borderRadius: BorderRadius.Pill,
        backgroundColor: toRgba(theme.colors.ActiveText, 0.08),
        borderWidth: 1,
        borderColor: toRgba(theme.colors.ActiveText, 0.12),
        width: '100%' as const,
        maxWidth: 320,
    },
    lockToggleGroup: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: Spacing.SM,
    },
    lockToggleLabel: {
        ...Typography.BodySmall,
        color: toRgba(theme.colors.MainText, 0.82),
        fontFamily: theme.fonts.primary?.semibold ?? theme.fonts.primary?.bold,
    },
    switchTrack: {
        width: 44,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.TertiaryBackground,
        justifyContent: 'center' as const,
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

export const RendererControls = <Backend extends RendererBackend>(
    props: RendererControlsProps<Backend>
) => {
    const {
        control,
        backendOrder,
        backendLabels,
        backendIcons,
        diagnostics,
        theme,
        activeBackend,
        lockLabel = 'Lock Renderer',
    } = props;

    const styles = useMemo(() => createStyles(theme), [theme]);

    const failedBackends = useMemo(
        () =>
            diagnostics?.failedBackends.reduce<Set<string>>(
                (accumulator, backend) => {
                    accumulator.add(backend);
                    return accumulator;
                },
                new Set<string>()
            ) ?? new Set<string>(),
        [diagnostics]
    );

    const segments = useMemo(
        () =>
            backendOrder.map<SegmentDescriptor<Backend>>((mode) => ({
                mode,
                label: backendLabels[mode],
                available: control.availability[mode],
                active: activeBackend === mode,
                isDisabled: !control.availability[mode],
                failed: failedBackends.has(mode),
            })),
        [
            backendOrder,
            backendLabels,
            control.availability,
            activeBackend,
            failedBackends,
        ]
    );

    const segmentAnimations = useSegmentAnimations(backendOrder, activeBackend);

    const switchTranslate = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(switchTranslate, {
            toValue: control.rendererLocked ? 1 : 0,
            duration: 120,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
        }).start();
    }, [control.rendererLocked, switchTranslate]);

    const knobTranslateX = useMemo(
        () =>
            switchTranslate.interpolate({
                inputRange: [0, 1],
                outputRange: [3, 23],
            }),
        [switchTranslate]
    );

    const [segmentTrackWidth, setSegmentTrackWidth] = useState<number>(0);
    const thumbTranslate = useRef(new Animated.Value(0)).current;
    const thumbWidth = useRef(new Animated.Value(0)).current;
    const segmentMetrics = useRef<Record<Backend, LayoutRectangle>>({});
    const lastActiveMode = useRef<Backend | null>(null);

    const snapThumbTo = useCallback(
        (mode: Backend) => {
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
        (mode: Backend) => {
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

    useEffect(() => {
        if (lastActiveMode.current === null) {
            snapThumbTo(activeBackend);
            return;
        }
        if (lastActiveMode.current === activeBackend) {
            return;
        }
        if (!animateThumbTo(activeBackend)) {
            lastActiveMode.current = activeBackend;
        }
    }, [activeBackend, animateThumbTo, snapThumbTo]);

    const toggleRendererLock = useCallback(() => {
        control.setRendererLocked((current) => !current);
    }, [control]);

    if (!segmentAnimations || segments.length === 0) {
        return null;
    }

    return (
        <View style={styles.lockRow}>
            <View style={styles.segmentWrapper}>
                <View
                    style={styles.segmentGroup}
                    onLayout={(event: LayoutChangeEvent) => {
                        setSegmentTrackWidth(event.nativeEvent.layout.width);
                        if (lastActiveMode.current === null) {
                            const initialMode =
                                segments.find((descriptor) => descriptor.active)
                                    ?.mode ?? segments[0]?.mode;
                            if (initialMode) {
                                snapThumbTo(initialMode);
                            }
                        }
                    }}
                >
                    <View style={styles.segmentBackground}>
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
                        {segments.map((descriptor, index) => {
                            const icon = backendIcons?.[descriptor.mode];
                            return (
                                <Pressable
                                    key={`${descriptor.mode}-${index}`}
                                    accessibilityRole="button"
                                    accessibilityHint={`Switch renderer to ${backendLabels[descriptor.mode]}`}
                                    accessibilityState={{
                                        disabled: descriptor.isDisabled,
                                        selected: descriptor.active,
                                    }}
                                    onPress={() => {
                                        control.setBackend(descriptor.mode);
                                        control.setActiveBackend(
                                            descriptor.mode
                                        );
                                        animateThumbTo(descriptor.mode);
                                    }}
                                    onLayout={(event: LayoutChangeEvent) => {
                                        const { layout } = event.nativeEvent;
                                        segmentMetrics.current[
                                            descriptor.mode
                                        ] = layout;
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
                                            styles,
                                            descriptor,
                                            mapSegmentState(pressableState),
                                            createOpacity(
                                                segmentAnimations[
                                                    descriptor.mode
                                                ],
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
                                            style={[styles.segmentContent]}
                                        >
                                            {icon ? (
                                                <Animated.Text
                                                    style={[
                                                        styles.segmentIcon,
                                                        createSegmentLabelStyles(
                                                            styles,
                                                            descriptor,
                                                            mapSegmentState(
                                                                pressableState
                                                            )
                                                        ),
                                                        {
                                                            opacity:
                                                                createOpacity(
                                                                    segmentAnimations[
                                                                        descriptor
                                                                            .mode
                                                                    ],
                                                                    descriptor.active
                                                                ),
                                                        },
                                                    ]}
                                                >
                                                    {icon}
                                                </Animated.Text>
                                            ) : null}
                                            <Animated.Text
                                                style={[
                                                    styles.segmentLabel,
                                                    createSegmentLabelStyles(
                                                        styles,
                                                        descriptor,
                                                        mapSegmentState(
                                                            pressableState
                                                        )
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
                            );
                        })}
                    </View>
                </View>
            </View>
            <View
                style={[
                    styles.lockTogglePanel,
                    segmentTrackWidth > 0
                        ? { width: segmentTrackWidth }
                        : undefined,
                ]}
            >
                <Text
                    style={[
                        styles.lockToggleLabel,
                        { opacity: control.rendererLocked ? 1 : 0.8 },
                    ]}
                >
                    {lockLabel}
                </Text>
                <View style={styles.lockToggleGroup}>
                    <Pressable onPress={toggleRendererLock}>
                        <View
                            style={[
                                styles.switchTrack,
                                control.rendererLocked &&
                                    styles.switchTrackActive,
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.switchKnob,
                                    control.rendererLocked &&
                                        styles.switchKnobActive,
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
};
