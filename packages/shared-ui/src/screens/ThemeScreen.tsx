// src/theme/ThemeScreen.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
} from 'react-native';
import { useTheme, themesByCategory, ColorKey } from '../theme';
import { useScreenWidth } from '../hooks';
import { ColorPicker, ActionButton } from '../small-components';
import { ChevronDown, ChevronUp } from '../icons';

// split CamelCase → Title Case
function toTitleCase(key: string) {
    return key
        .replaceAll(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, (c) => c.toUpperCase());
}

export const ThemeScreen: React.FC = () => {
    const {
        theme,
        customTheme,
        setThemeByName,
        updateCustomThemeName,
        updateCustomThemeColor,
        applyCustom,
    } = useTheme();

    const [open, setOpen] = useState<Partial<Record<ColorKey, boolean>>>({});
    const [customThemeOpen, setCustomThemeOpen] = useState(false);

    const screenWidth = useScreenWidth(1920);
    const cols = screenWidth > 1000 ? 6 : screenWidth > 600 ? 5 : 4;
    const pad = 16;
    const gap = 8;
    const itemW = (screenWidth - pad * 2 - gap * (cols - 1)) / cols;
    const itemH = itemW * 0.6 + 35;

    return (
        <ScrollView
            style={[
                styles.container,
                { backgroundColor: theme.colors.PrimaryBackground },
            ]}
            contentContainerStyle={[styles.content, { paddingHorizontal: pad }]}
            showsVerticalScrollIndicator={false}
        >
            <Text style={[styles.title, { color: theme.colors.Primary }]}>
                Select Theme
            </Text>

            {/* —— Customize Theme Button + Editor —— */}
            <View style={styles.section}>
                <View style={styles.customHeader}>
                    <ActionButton
                        onPress={() => setCustomThemeOpen((prev) => !prev)}
                        transparent
                    >
                        {customThemeOpen ? <ChevronUp /> : <ChevronDown />}
                    </ActionButton>
                    <TouchableOpacity
                        style={[
                            styles.customBtn,
                            { borderColor: theme.colors.SecondaryBackground },
                        ]}
                        onPress={() => {
                            applyCustom();
                            setCustomThemeOpen(true);
                        }}
                    >
                        <Text
                            style={[
                                styles.customBtnText,
                                { color: theme.colors.Primary },
                            ]}
                        >
                            Customize Theme
                        </Text>
                    </TouchableOpacity>
                </View>

                {customThemeOpen && (
                    <View>
                        <View style={styles.nameRow}>
                            <Text
                                style={[
                                    styles.nameLabel,
                                    { color: theme.colors.MainText },
                                ]}
                            >
                                Theme Name
                            </Text>
                            <TextInput
                                style={[
                                    styles.nameInput,
                                    {
                                        borderColor:
                                            theme.colors.SecondaryBackground,
                                        color: theme.colors.MainText,
                                    },
                                ]}
                                value={customTheme.name}
                                onChangeText={updateCustomThemeName}
                                placeholder="Custom Theme"
                                placeholderTextColor={theme.colors.InactiveText}
                            />
                        </View>

                        {(Object.keys(customTheme.colors) as ColorKey[]).map(
                            (key) => {
                                const friendly = toTitleCase(key);
                                const val = customTheme.colors[key];
                                return (
                                    <View key={key} style={styles.colorRow}>
                                        <Text
                                            style={[
                                                styles.colorLabel,
                                                {
                                                    color: theme.colors
                                                        .MainText,
                                                },
                                            ]}
                                        >
                                            {friendly}
                                        </Text>
                                        <View
                                            style={[
                                                styles.miniSwatch,
                                                { backgroundColor: val },
                                            ]}
                                        />
                                        <TextInput
                                            style={[
                                                styles.hexInput,
                                                {
                                                    borderColor:
                                                        theme.colors
                                                            .SecondaryBackground,
                                                    color: theme.colors
                                                        .MainText,
                                                },
                                            ]}
                                            value={val}
                                            onChangeText={(t) =>
                                                updateCustomThemeColor(key, t)
                                            }
                                        />
                                        <TouchableOpacity
                                            onPress={() =>
                                                setOpen((o) => ({
                                                    ...o,
                                                    [key]: !o[key],
                                                }))
                                            }
                                        >
                                            <Text
                                                style={{
                                                    color: theme.colors.Primary,
                                                }}
                                            >
                                                ✏️
                                            </Text>
                                        </TouchableOpacity>

                                        {open[key] && (
                                            <ColorPicker
                                                color={val}
                                                onChange={(hex) =>
                                                    updateCustomThemeColor(
                                                        key,
                                                        hex
                                                    )
                                                }
                                            />
                                        )}
                                    </View>
                                );
                            }
                        )}
                    </View>
                )}
            </View>

            {/* —— Built-in Themes Grid —— */}
            {Object.entries(themesByCategory).map(([category, list]) => (
                <View key={category} style={styles.section}>
                    <Text
                        style={[
                            styles.sectionTitle,
                            { color: theme.colors.MainText },
                        ]}
                    >
                        {category}
                    </Text>
                    <View style={styles.grid}>
                        {list.map((t) => (
                            <TouchableOpacity
                                key={t.name}
                                onPress={() => setThemeByName(t.name)}
                                style={[
                                    styles.preview,
                                    {
                                        width: itemW,
                                        height: itemH,
                                        backgroundColor:
                                            t.colors.PrimaryBackground,
                                        borderColor:
                                            t.name === theme.name
                                                ? theme.colors.Primary
                                                : 'rgba(128,128,128,0.3)',
                                        borderWidth:
                                            t.name === theme.name ? 2 : 1,
                                        marginRight: gap,
                                        marginBottom: gap,
                                    },
                                ]}
                            >
                                <View style={styles.swatches}>
                                    <View
                                        style={[
                                            styles.swatch,
                                            {
                                                backgroundColor:
                                                    t.colors.Primary,
                                            },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.swatch,
                                            {
                                                backgroundColor:
                                                    t.colors.Secondary,
                                            },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.swatch,
                                            {
                                                backgroundColor:
                                                    t.colors.Tertiary,
                                            },
                                        ]}
                                    />
                                    <View
                                        style={[
                                            styles.swatch,
                                            {
                                                backgroundColor:
                                                    t.colors.MainText,
                                            },
                                        ]}
                                    />
                                </View>

                                <Text
                                    style={[
                                        styles.previewLabel,
                                        { color: t.colors.MainText },
                                    ]}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {t.name}
                                </Text>

                                {t.name === theme.name && (
                                    <View
                                        style={[
                                            styles.check,
                                            {
                                                backgroundColor:
                                                    theme.colors
                                                        .PrimaryBackground,
                                                borderColor:
                                                    theme.colors.Primary,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.checkMark,
                                                { color: theme.colors.Primary },
                                            ]}
                                        >
                                            ✓
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingTop: 20, paddingBottom: 30 },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 24,
        textAlign: 'center',
    },
    section: { marginBottom: 24 },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        justifyContent: 'center',
    },
    customBtn: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    customBtnText: { fontSize: 14, fontWeight: '600' },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    nameLabel: { width: 100, fontSize: 14, fontWeight: '600' },
    nameInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 6,
        padding: 6,
    },
    colorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        flexWrap: 'nowrap',
    },
    colorLabel: {
        flexShrink: 0,
        width: 120,
        fontSize: 14,
        fontWeight: '500',
    },
    miniSwatch: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 1,
        marginRight: 8,
    },
    hexInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 4,
        padding: 4,
        marginRight: 8,
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    preview: {
        borderRadius: 8,
        overflow: 'hidden',
        padding: 6,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    swatches: {
        flexDirection: 'row',
        height: 12,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    swatch: { flex: 1 },
    previewLabel: {
        fontSize: 12,
        fontWeight: '500',
        width: '100%',
        textAlign: 'center',
    },
    check: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkMark: { fontSize: 11, fontWeight: 'bold', lineHeight: 18 },
});
