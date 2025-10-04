// src/theme/ThemeScreen.tsx
import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Platform,
    Pressable,
} from 'react-native';

import { Theme, useTheme, themesByCategory } from '../theme';
import { BorderRadius, Spacing, Typography } from '../constants/designSystem';
import { useScreenWidth } from '../hooks/useScreenWidth';
import { toRgba } from '../utils';
import { useThemedScrollbars } from '../styles';
import {
    availableFontFamilies,
    sameFontFamily,
    type FontFamily,
} from '../constants/fonts';
import { GlowKeyframes } from '../components/GlowKeyframes';
import { useAnimatedGlow } from '../hooks/useAnimatedGlow';

const createStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        scrollContent: {
            paddingTop: Spacing.XXXL,
            paddingBottom: Spacing.XXXL + Spacing.SM,
            paddingHorizontal: Spacing.XXXL,
        },
        headerBlock: {
            marginBottom: Spacing.XXXL + Spacing.MD,
        },
        eyebrow: {
            ...Typography.Eyebrow,
            color: toRgba(theme.colors.MainText, 0.6),
            marginBottom: Spacing.SM,
        },
        pageTitle: {
            ...Typography.H1,
            color: theme.colors.MainText,
            fontFamily: theme.fonts.primary?.bold,
        },
        pageSubtitle: {
            ...Typography.Body,
            color: toRgba(theme.colors.MainText, 0.7),
            marginTop: Spacing.SM,
        },
        section: {
            marginBottom: Spacing.XXXL + Spacing.SM,
        },
        sectionTitle: {
            ...Typography.H2,
            color: theme.colors.MainText,
            fontFamily: theme.fonts.primary?.bold,
            marginBottom: Spacing.XL,
        },
        categorySection: {
            marginBottom: Spacing.XXXL,
        },
        categorySectionLabel: {
            ...Typography.SectionHeading,
            color: theme.colors.MainText,
            fontFamily:
                theme.fonts.primary?.semibold ?? theme.fonts.primary?.bold,
            marginBottom: Spacing.LG,
        },
        themeGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        fontSelectorWrapper: {
            marginBottom: Spacing.XL,
        },
        fontLabel: {
            ...Typography.BodySmall,
            fontFamily:
                theme.fonts.secondary?.semibold ?? theme.fonts.secondary?.bold,
            color: theme.colors.MainText,
            marginBottom: Spacing.SM,
        },
        dropdownTrigger: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.LG + 2,
            paddingVertical: Spacing.MD + 3,
            backgroundColor: theme.colors.TertiaryBackground,
            borderRadius: BorderRadius.Small,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.2),
            minHeight: 46,
        },
        dropdownTriggerActive: {
            borderColor: toRgba(theme.colors.Primary, 0.4),
        },
        dropdownTriggerText: {
            ...Typography.BodySmall,
            color: theme.colors.MainText,
            fontFamily: theme.fonts.secondary?.regular,
        },
        dropdownTriggerPlaceholder: {
            color: toRgba(theme.colors.MainText, 0.5),
        },
        dropdownMenuContainer: {
            marginTop: Spacing.MD,
        },
        dropdownMenu: {
            backgroundColor: theme.colors.TertiaryBackground,
            borderRadius: BorderRadius.Small,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.15),
            overflow: 'hidden',
            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.12,
                    shadowRadius: 12,
                },
                android: {
                    elevation: 4,
                },
                web: {
                    boxShadow: `0 4px 12px ${toRgba('#000', 0.12)}`,
                },
            }),
        },
        dropdownScrollView: {
            maxHeight: 1000,
        },
        dropdownOption: {
            paddingHorizontal: Spacing.LG + 2,
            paddingVertical: Spacing.MD + 3,
            minHeight: 46,
        },
        dropdownOptionLast: {
            borderBottomWidth: 0,
        },
        dropdownOptionHover: {
            backgroundColor: toRgba(theme.colors.ActiveText, 0.05),
        },
        dropdownOptionSelected: {
            backgroundColor: toRgba(theme.colors.ActiveText, 0.08),
        },
        dropdownOptionText: {
            ...Typography.BodySmall,
            color: theme.colors.MainText,
            fontFamily: theme.fonts.secondary?.regular,
        },
        fontPreviewCard: {
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: BorderRadius.Small,
            padding: Spacing.LG,
            marginTop: Spacing.MD,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, 0.1),
        },
        fontPreviewTitle: {
            ...Typography.Eyebrow,
            color: toRgba(theme.colors.MainText, 0.6),
            fontFamily:
                theme.fonts.secondary?.semibold ?? theme.fonts.secondary?.bold,
            marginBottom: Spacing.SM,
        },
        fontPreviewHeading: {
            ...Typography.H2,
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.MainText,
            marginBottom: Spacing.SM,
        },
        fontPreviewSubheading: {
            ...Typography.H3,
            fontFamily: theme.fonts.primary?.semibold,
            color: theme.colors.MainText,
            marginBottom: Spacing.MD,
        },
        fontPreviewBody: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.MainText,
            marginBottom: Spacing.SM,
        },
        fontPreviewCode: {
            ...Typography.Caption,
            fontFamily:
                theme.fonts.monospace?.regular ??
                Platform.select({
                    web: 'monospace',
                    default: 'Courier',
                }),
            color: theme.colors.ActiveText,
            backgroundColor: toRgba(theme.colors.ActiveText, 0.1),
            padding: Spacing.SM,
            borderRadius: BorderRadius.ExtraSmall - 2,
        },
        previewWrapper: {
            borderRadius: BorderRadius.Small,
            overflow: 'hidden',
        },
        previewContainer: {
            borderRadius: BorderRadius.Small,
            overflow: 'hidden',
            padding: Spacing.SM,
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            borderWidth: 1,
        },
        swatchContainer: {
            flexDirection: 'row',
            height: Spacing.SM + Spacing.XS + 2,
            width: '100%',
            borderRadius: BorderRadius.ExtraSmall - 2,
            overflow: 'hidden',
            marginBottom: Spacing.SM + 2,
        },
        swatch: {
            flex: 1,
        },
        previewLabel: {
            ...Typography.Caption,
            fontWeight: '600',
            fontFamily:
                theme.fonts.secondary?.semibold ?? theme.fonts.secondary?.bold,
            textAlign: 'center',
            width: '100%',
        },
        activeIndicator: {
            position: 'absolute',
            top: Spacing.XS + 2,
            right: Spacing.XS + 2,
            borderRadius: BorderRadius.Small,
            width: Spacing.XXL,
            height: Spacing.XXL,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
        },
        checkmark: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.bold,
        },
    });

// --- ThemePreview Component Definition ---
interface ThemePreviewProps {
    themeData: Theme;
    isActive: boolean;
    onPress: () => void;
    width: number;
    height: number;
    margin: number;
}

// eslint-disable-next-line react/display-name
const ThemePreview: React.FC<ThemePreviewProps> = React.memo(
    ({ themeData, isActive, onPress, width, height, margin }) => {
        // Get the currently active theme context to style the *active* indicator/border correctly
        const { theme: activeThemeContext } = useTheme();
        const styles = useMemo(
            () => createStyles(activeThemeContext),
            [activeThemeContext]
        );
        const { webAnimation, createNativeShadowStyle } = useAnimatedGlow(
            0.08,
            0.28,
            2500
        );

        const WrapperComponent =
            Platform.OS === 'web' && isActive ? View : Animated.View;

        const getWrapperStyle = () => {
            const baseStyle = {
                borderRadius: BorderRadius.Small,
                overflow: 'hidden' as const,
            };

            if (Platform.OS === 'web' && isActive) {
                return [baseStyle, webAnimation.style];
            }
            if (isActive) {
                return [
                    baseStyle,
                    createNativeShadowStyle(activeThemeContext.colors.Primary),
                ];
            }
            return baseStyle;
        };
        const wrapperStyle = getWrapperStyle();

        return (
            <View
                style={[
                    styles.previewWrapper,
                    {
                        marginRight: margin,
                        marginBottom: margin,
                    },
                ]}
            >
                {isActive && (
                    <GlowKeyframes
                        color={activeThemeContext.colors.Primary}
                        focal={{ x: 0.5, y: 0.4 }}
                    />
                )}
                <WrapperComponent style={wrapperStyle}>
                    <TouchableOpacity
                        onPress={onPress}
                        style={[
                            styles.previewContainer,
                            {
                                width,
                                height,
                                backgroundColor:
                                    themeData.colors.PrimaryBackground,
                                borderColor: isActive
                                    ? activeThemeContext.colors.Primary
                                    : toRgba(
                                          activeThemeContext.colors.ActiveText,
                                          0.15
                                      ),
                            },
                        ]}
                        accessibilityLabel={`Select theme: ${themeData.name}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isActive }}
                    >
                        {/* --- More Informative Swatches --- */}
                        <View style={styles.swatchContainer}>
                            <View
                                style={[
                                    styles.swatch,
                                    {
                                        backgroundColor:
                                            themeData.colors.Primary,
                                    },
                                ]}
                            />
                            {/* Added Secondary color swatch */}
                            <View
                                style={[
                                    styles.swatch,
                                    {
                                        backgroundColor:
                                            themeData.colors.Secondary,
                                    }, // Assuming Secondary exists
                                ]}
                            />
                            <View
                                style={[
                                    styles.swatch,
                                    {
                                        backgroundColor:
                                            themeData.colors.MainText,
                                    },
                                ]}
                            />
                        </View>

                        {/* --- Slightly Larger Theme Name Label --- */}
                        <Text
                            style={[
                                styles.previewLabel,
                                { color: themeData.colors.MainText }, // Label color from its own theme
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {themeData.name}
                        </Text>

                        {/* --- Clearer Active Indicator --- */}
                        {isActive && (
                            <View
                                style={[
                                    styles.activeIndicator,
                                    {
                                        // Use active theme's background for contrast, primary for border
                                        backgroundColor:
                                            activeThemeContext.colors
                                                .PrimaryBackground,
                                        borderColor:
                                            activeThemeContext.colors.Primary,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.checkmark,
                                        // Use active theme's primary color for the checkmark itself
                                        {
                                            color: activeThemeContext.colors
                                                .Primary,
                                        },
                                    ]}
                                >
                                    ✓
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </WrapperComponent>
            </View>
        );
    }
);

// --- Helper Functions ---
const getCurrentFontName = (
    fontFamily: FontFamily | undefined
): string | undefined =>
    availableFontFamilies.find((f) => sameFontFamily(f.family, fontFamily))
        ?.name;

// --- Font Preview Component ---
interface FontPreviewProps {
    fontFamily: FontFamily | undefined;
    previewType: 'primary' | 'secondary' | 'monospace';
    styles: ReturnType<typeof createStyles>;
}

const FontPreview: React.FC<FontPreviewProps> = ({
    fontFamily,
    previewType,
    styles,
}) => {
    if (!fontFamily) return null;

    const previewContent = {
        primary: {
            title: 'PRIMARY FONT',
            heading: 'The Quick Brown Fox',
            subheading: 'Display & Content Typography',
            body: 'This is how your primary font looks in regular body text. It will be used for headings, primary content, and display text throughout the application. The friendly curves work beautifully at larger sizes.',
        },
        secondary: {
            title: 'SECONDARY FONT',
            heading: 'Interface Typography',
            subheading: 'Labels & Metadata',
            body: 'Your secondary font appears in UI labels, message timestamps, conversation metadata, and small caps throughout the app. It provides visual contrast and is optimized for clarity at smaller sizes.',
        },
        monospace: {
            title: 'MONOSPACE FONT',
            heading: 'Code & Technical Text',
            subheading: 'Fixed-Width Characters',
            body: 'function example() {\n  const value = "monospace";\n  return value.length;\n}',
        },
    };

    const content = previewContent[previewType];

    return (
        <View style={styles.fontPreviewCard}>
            <Text style={styles.fontPreviewTitle}>{content.title}</Text>
            <Text
                style={[
                    styles.fontPreviewHeading,
                    { fontFamily: fontFamily.bold },
                ]}
            >
                {content.heading}
            </Text>
            <Text
                style={[
                    styles.fontPreviewSubheading,
                    {
                        fontFamily: fontFamily.semibold ?? fontFamily.bold,
                    },
                ]}
            >
                {content.subheading}
            </Text>
            <Text
                style={[
                    styles.fontPreviewBody,
                    { fontFamily: fontFamily.regular },
                ]}
            >
                {content.body}
            </Text>
            {previewType === 'monospace' && (
                <Text
                    style={[
                        styles.fontPreviewCode,
                        { fontFamily: fontFamily.regular },
                    ]}
                >
                    const greeting = "Hello, World!";{'\n'}
                    console.log(greeting);
                </Text>
            )}
        </View>
    );
};

// --- FontSelector Component Definition ---
interface FontSelectorProps {
    label: string;
    selectedFont: string | undefined;
    onValueChange: (value: string | undefined) => void;
    allowNone?: boolean;
}

const DropdownIcon: React.FC<{ isOpen: boolean; color: string }> = ({
    isOpen,
    color,
}) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(rotateAnim, {
            toValue: isOpen ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [isOpen, rotateAnim]);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <Animated.View
            style={{
                transform: [{ rotate: rotation }],
                width: 14,
                height: 14,
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <View
                style={{
                    width: 8,
                    height: 8,
                    borderRightWidth: 2,
                    borderBottomWidth: 2,
                    borderColor: color,
                    transform: [{ rotate: '45deg' }, { translateY: -1.5 }],
                }}
            />
        </Animated.View>
    );
};

interface DropdownOptionProps {
    label: string;
    isSelected: boolean;
    onPress: () => void;
    styles: ReturnType<typeof createStyles>;
    isLast: boolean;
}

const DropdownOption: React.FC<DropdownOptionProps> = ({
    label,
    isSelected,
    onPress,
    styles,
    isLast,
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <Pressable
            onPress={onPress}
            onHoverIn={() => setIsHovered(true)}
            onHoverOut={() => setIsHovered(false)}
            style={[
                styles.dropdownOption,
                isLast && styles.dropdownOptionLast,
                isHovered && styles.dropdownOptionHover,
                isSelected && styles.dropdownOptionSelected,
            ]}
        >
            <Text style={styles.dropdownOptionText}>{label}</Text>
        </Pressable>
    );
};

const FontSelector: React.FC<FontSelectorProps> = ({
    label,
    selectedFont,
    onValueChange,
    allowNone = false,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const [isOpen, setIsOpen] = useState(false);
    const menuHeight = useRef(new Animated.Value(0)).current;

    const options = useMemo(
        () => [
            ...(allowNone ? [{ label: 'None', value: 'none' }] : []),
            ...availableFontFamilies.map((font) => ({
                label: font.name,
                value: font.name,
            })),
        ],
        [allowNone]
    );

    const selectedLabel = useMemo(
        () =>
            options.find((opt) => opt.value === (selectedFont ?? 'none'))
                ?.label ?? 'Select a font',
        [options, selectedFont]
    );

    const toggleDropdown = () => {
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    };

    const openDropdown = () => {
        setIsOpen(true);
        Animated.spring(menuHeight, {
            toValue: maxDropdownHeight,
            useNativeDriver: false,
            damping: 18,
            stiffness: 180,
        }).start();
    };

    const closeDropdown = () => {
        Animated.timing(menuHeight, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
        }).start(() => setIsOpen(false));
    };

    const handleSelect = (value: string) => {
        onValueChange(value === 'none' ? undefined : value);
        closeDropdown();
    };

    const maxDropdownHeight = Math.min(options.length * 46, 400);

    useEffect(() => {
        if (isOpen) {
            Animated.spring(menuHeight, {
                toValue: maxDropdownHeight,
                useNativeDriver: false,
                damping: 18,
                stiffness: 180,
            }).start();
        }
    }, [isOpen, maxDropdownHeight, menuHeight]);

    return (
        <View style={styles.fontSelectorWrapper}>
            <Text style={styles.fontLabel}>{label}</Text>
            <View>
                <TouchableOpacity
                    onPress={toggleDropdown}
                    style={[
                        styles.dropdownTrigger,
                        isOpen && styles.dropdownTriggerActive,
                    ]}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.dropdownTriggerText,
                            !selectedFont && styles.dropdownTriggerPlaceholder,
                        ]}
                    >
                        {selectedLabel}
                    </Text>
                    <DropdownIcon
                        isOpen={isOpen}
                        color={toRgba(theme.colors.MainText, 0.6)}
                    />
                </TouchableOpacity>

                {isOpen && (
                    <View style={styles.dropdownMenuContainer}>
                        <Animated.View
                            style={[
                                styles.dropdownMenu,
                                {
                                    height: menuHeight,
                                },
                            ]}
                        >
                            <ScrollView
                                style={styles.dropdownScrollView}
                                nestedScrollEnabled
                                showsVerticalScrollIndicator={false}
                            >
                                {options.map((option, index) => (
                                    <DropdownOption
                                        key={option.value}
                                        label={option.label}
                                        isSelected={
                                            option.value ===
                                            (selectedFont ?? 'none')
                                        }
                                        isLast={index === options.length - 1}
                                        onPress={() =>
                                            handleSelect(option.value)
                                        }
                                        styles={styles}
                                    />
                                ))}
                            </ScrollView>
                        </Animated.View>
                    </View>
                )}
            </View>
        </View>
    );
};

export const ThemeScreen: React.FC = () => {
    const {
        theme,
        setThemeByName,
        setPrimaryFont,
        setSecondaryFont,
        setMonospaceFont,
    } = useTheme();
    const screenWidth = useScreenWidth(1920);
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { ScrollbarStyles } = useThemedScrollbars();

    const numColumns =
        [
            { threshold: 1000, columns: 6 },
            { threshold: 600, columns: 5 },
            { threshold: 0, columns: 4 },
        ].find(({ threshold }) => screenWidth > threshold)?.columns ?? 4;
    const itemPaddingHorizontal = 32;
    const itemMargin = 8;

    const totalHorizontalMargin = itemMargin * (numColumns - 1);
    const availableWidth =
        screenWidth - itemPaddingHorizontal * 2 - totalHorizontalMargin;
    const itemWidth = availableWidth / numColumns;
    const previewHeight = itemWidth * 0.6 + 35;

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: theme.colors.PrimaryBackground },
            ]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nativeID="theme-screen-scroll"
        >
            <ScrollbarStyles targetSelector="#theme-screen-scroll" />

            <View style={styles.headerBlock}>
                <Text style={styles.eyebrow}>SETTINGS</Text>
                <Text style={styles.pageTitle}>Appearance</Text>
                <Text style={styles.pageSubtitle}>
                    Customize themes and typography to match your style
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Font Configuration</Text>
                <FontSelector
                    label="Primary Font"
                    selectedFont={getCurrentFontName(theme.fonts.primary)}
                    onValueChange={(value) => value && setPrimaryFont(value)}
                />
                {theme.fonts.primary && (
                    <FontPreview
                        fontFamily={theme.fonts.primary}
                        previewType="primary"
                        styles={styles}
                    />
                )}
                <View style={{ marginTop: Spacing.XL }}>
                    <FontSelector
                        label="Secondary Font"
                        selectedFont={
                            getCurrentFontName(theme.fonts.secondary) ?? 'Inter'
                        }
                        onValueChange={(value) =>
                            value && setSecondaryFont(value)
                        }
                    />
                    {theme.fonts.secondary && (
                        <FontPreview
                            fontFamily={theme.fonts.secondary}
                            previewType="secondary"
                            styles={styles}
                        />
                    )}
                </View>
                <View style={{ marginTop: Spacing.XL }}>
                    <FontSelector
                        label="Monospace Font"
                        selectedFont={
                            getCurrentFontName(theme.fonts.monospace) ??
                            'Source Code Pro'
                        }
                        onValueChange={(value) =>
                            value && setMonospaceFont(value)
                        }
                    />
                    {theme.fonts.monospace && (
                        <FontPreview
                            fontFamily={theme.fonts.monospace}
                            previewType="monospace"
                            styles={styles}
                        />
                    )}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Color Themes</Text>
                {Object.entries(themesByCategory).map(([category, themes]) => (
                    <View key={category} style={styles.categorySection}>
                        <Text style={styles.categorySectionLabel}>
                            {category}
                        </Text>
                        <View style={styles.themeGrid}>
                            {themes.map((t) => (
                                <ThemePreview
                                    key={t.name}
                                    themeData={t}
                                    isActive={t.name === theme.name}
                                    onPress={() => setThemeByName(t.name)}
                                    width={itemWidth}
                                    height={previewHeight}
                                    margin={itemMargin}
                                />
                            ))}
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};
