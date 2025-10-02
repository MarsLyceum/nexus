import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Platform,
    Animated,
    useWindowDimensions,
} from 'react-native';

import { useTheme } from '../theme';
import { toRgba } from '../utils';
import { useAnimatedGlow } from '../hooks';
import type { Theme } from '../theme';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';
import { useThemedScrollbars, NexusScrollView } from '../styles';
import { WebGPUGlow } from '../components/WebGPUGlow';
import { GlowKeyframes } from '../components/GlowKeyframes';
import {
    useAnimationDriver,
    type AnimationDriverPreference,
} from '../providers/AnimationProvider';

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

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
    componentStack,
    onReset,
}) => {
    const { theme } = useTheme();
    const {
        preferredDriver,
        effectiveDriver,
        capabilities,
        selectDriver,
        reportDriverFailure,
        reportDriverRecovery,
    } = useAnimationDriver();
    const { width, height } = useWindowDimensions();
    const { ScrollbarStyles } = useThemedScrollbars();
    const { webAnimationStyle, createNativeShadowStyle } = useAnimatedGlow(
        0.2,
        0.5,
        3000
    );
    const [webGpuReady, setWebGpuReady] = useState(false);
    const isGpuPreferred = Platform.OS === 'web' && effectiveDriver === 'gpu';
    const useCssGlow = !isGpuPreferred;
    const stackLines = useMemo(
        () => deriveStackLines(componentStack),
        [componentStack]
    );
    const baseStyles = useMemo(() => createStyles(theme), [theme]);
    const { styles: responsiveStyles, shouldScroll } = useMemo(
        () => createResponsiveOverrides(width, height),
        [height, width]
    );

    const handleReset = () => {
        resetErrorBoundary();
        onReset?.();
    };

    const handleDriverToggle = () => {
        const nextPreference: AnimationDriverPreference =
            preferredDriver === 'css'
                ? capabilities.gpu
                    ? 'gpu'
                    : 'css'
                : 'css';
        selectDriver(nextPreference);
    };

    const handleGpuReady = () => {
        reportDriverRecovery('gpu');
        setWebGpuReady(true);
    };

    const handleGpuFailure = () => {
        reportDriverFailure('gpu');
        setWebGpuReady(false);
    };

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
                    {Platform.OS === 'web' ? (
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
                    ) : (
                        <View style={baseStyles.stackSurface}>
                            <NexusScrollView
                                style={baseStyles.stackScroll}
                                contentContainerStyle={baseStyles.stackContent}
                                nativeID={STACK_SCROLL_ID}
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
                                            <Text
                                                style={baseStyles.stackLocation}
                                            >
                                                {line.location}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </NexusScrollView>
                        </View>
                    )}
                </View>
            )}
            <View style={baseStyles.footer}>
                {capabilities.gpu && (
                    <Pressable
                        onPress={handleDriverToggle}
                        style={({ pressed }) =>
                            pressed
                                ? baseStyles.secondaryButtonPressed
                                : baseStyles.secondaryButton
                        }
                    >
                        <Text style={baseStyles.secondaryButtonText}>
                            {isGpuPreferred
                                ? 'Use CSS Glow'
                                : webGpuReady
                                  ? 'Use WebGPU Glow'
                                  : 'Try WebGPU Glow'}
                        </Text>
                    </Pressable>
                )}
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

    return (
        <View style={[baseStyles.backdrop, responsiveStyles.backdrop]}>
            {scrollStyles}
            {Platform.OS === 'web' ? (
                <View
                    style={[
                        baseStyles.shellContainer,
                        responsiveStyles.shellContainer,
                        useCssGlow ? webAnimationStyle : null,
                    ]}
                    nativeID="error-fallback-shell"
                >
                    {Platform.OS === 'web' && (
                        <style>{`
                            #error-fallback-shell { position: relative; isolation: isolate; }
                        `}</style>
                    )}
                    {(useCssGlow || !webGpuReady) && Platform.OS === 'web' && (
                        <GlowKeyframes color={theme.colors.Primary} />
                    )}
                    {isGpuPreferred && (
                        <WebGPUGlow
                            color={theme.colors.Primary}
                            borderRadius={BorderRadius.ExtraLarge}
                            focal={{ x: 0.5, y: 0.5 }}
                            opacity={0.85}
                            animate
                            onReady={handleGpuReady}
                            onFailure={handleGpuFailure}
                        />
                    )}
                    <View style={[baseStyles.shell, responsiveStyles.shell]}>
                        <View style={[baseStyles.card, responsiveStyles.card]}>
                            {shouldScroll ? (
                                <NexusScrollView
                                    style={responsiveStyles.cardScroll}
                                    contentContainerStyle={
                                        responsiveStyles.cardScrollContent
                                    }
                                    nativeID="error-fallback-scroll"
                                >
                                    {cardContent}
                                </NexusScrollView>
                            ) : (
                                cardContent
                            )}
                        </View>
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
                            {shouldScroll ? (
                                <NexusScrollView
                                    style={responsiveStyles.cardScroll}
                                    contentContainerStyle={
                                        responsiveStyles.cardScrollContent
                                    }
                                    nativeID="error-fallback-scroll"
                                >
                                    {cardContent}
                                </NexusScrollView>
                            ) : (
                                cardContent
                            )}
                        </View>
                    </View>
                </Animated.View>
            )}
        </View>
    );
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
        },
        shell: {
            width: '100%',
            borderRadius: BorderRadius.ExtraLarge,
            padding: Spacing.XS,
            backgroundColor: theme.colors.TertiaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.05),
        },
        card: {
            width: '100%',
            borderRadius: BorderRadius.Large,
            backgroundColor: theme.colors.SecondaryBackground,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.05),
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
