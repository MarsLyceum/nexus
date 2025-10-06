import React, { useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    useWindowDimensions,
    Pressable,
    Animated,
} from 'react-native';

import { useTheme } from '../theme';
import { toRgba } from '../utils';
import type { Theme } from '../theme';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';
import { useThemedScrollbars, NexusScrollView } from '../styles';
import { AnimationProvider } from '../providers/AnimationProvider';
import { Glow, hasWebGPU, hasWebGL, type GlowBackend } from '../effects/glow';
import { useRendererControl } from '../hooks/useRendererControl';
import { RendererControls } from './RendererControls';
import { useAnimatedGlow } from '../hooks';

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

type GlowRendererBackend = Exclude<GlowBackend, 'auto'>;

const GLOW_BACKEND_ORDER: ReadonlyArray<GlowRendererBackend> = [
    'webgpu',
    'webgl',
    'css',
];

const GLOW_BACKEND_LABELS: Record<GlowRendererBackend | 'auto', string> = {
    webgpu: 'WebGPU',
    webgl: 'WebGL',
    css: 'CSS',
    auto: 'Auto',
};

const GLOW_BACKEND_ICONS: Record<GlowRendererBackend, string> = {
    webgpu: '⛶',
    webgl: '⬚',
    css: '{}',
};

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

const useGlowControl = () => {
    const isWeb = Platform.OS === 'web';
    const webgpuAvailable = isWeb && hasWebGPU();
    const webglAvailable = isWeb && hasWebGL();

    const control = useRendererControl<GlowRendererBackend>({
        availability: {
            webgpu: webgpuAvailable,
            webgl: webglAvailable,
            css: true,
        },
        initialPreferredBackend: 'auto',
        initialActiveBackend: webgpuAvailable
            ? 'webgpu'
            : webglAvailable
              ? 'webgl'
              : 'css',
        initialDiagnostics: {
            failedBackends: [],
            backendErrors: {},
            attemptedBackends: [],
        },
    });

    return {
        control,
        isWeb,
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
    const { control, isWeb } = useGlowControl();
    const {
        preferredBackend,
        diagnostics,
        rendererLocked,
        setStatus,
        setDiagnostics,
    } = control;
    const { createNativeShadowStyle } = useAnimatedGlow();
    const { width, height } = useWindowDimensions();
    const { ScrollbarStyles } = useThemedScrollbars();
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

    const rendererControls = useMemo(() => {
        if (!isWeb) {
            return null;
        }
        const { activeBackend } = control;
        const resolvedActiveBackend: GlowRendererBackend =
            activeBackend === 'auto'
                ? control.availability.webgpu
                    ? 'webgpu'
                    : control.availability.webgl
                      ? 'webgl'
                      : 'css'
                : activeBackend;

        return (
            <RendererControls
                control={control}
                backendOrder={GLOW_BACKEND_ORDER}
                backendLabels={GLOW_BACKEND_LABELS}
                backendIcons={GLOW_BACKEND_ICONS}
                diagnostics={diagnostics}
                theme={theme}
                activeBackend={resolvedActiveBackend}
                lockLabel={
                    rendererLocked ? 'Renderer Locked' : 'Allow Switching'
                }
            />
        );
    }, [control, diagnostics, isWeb, rendererLocked, theme]);

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
                GLOW_BACKEND_LABELS[summary.lastBackend as GlowBackend] ??
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
                        onBackendChange={control.setActiveBackend}
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
