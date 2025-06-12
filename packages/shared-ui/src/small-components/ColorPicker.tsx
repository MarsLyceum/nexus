// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
// src/components/ColorPicker.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    PanResponder,
    GestureResponderEvent,
    LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

function hexToRgb(hex: string) {
    const r = Number.parseInt(hex.slice(1, 3), 16);
    const g = Number.parseInt(hex.slice(3, 5), 16);
    const b = Number.parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number) {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const toHex = (v: number) => {
        const c = Math.max(0, Math.min(255, Math.round(v)));
        const h = c.toString(16);
        return h.padStart(2, '0');
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToCmyk(r: number, g: number, b: number) {
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    const k = 1 - Math.max(rr, gg, bb);
    let c = 0;
    let m = 0;
    let y = 0;
    if (k < 1) {
        c = (1 - rr - k) / (1 - k);
        m = (1 - gg - k) / (1 - k);
        y = (1 - bb - k) / (1 - k);
    }
    return { c, m, y, k };
}

function rgbToHsl(r: number, g: number, b: number) {
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === rr) {
            h = (gg - bb) / d + (gg < bb ? 6 : 0);
        } else if (max === gg) {
            h = (bb - rr) / d + 2;
        } else {
            h = (rr - gg) / d + 4;
        }
        h /= 6;
    }
    return { h: h * 360, s, l };
}

function hslToRgb(h: number, s: number, l: number) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const hh = h / 60;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;
    if (hh >= 0 && hh < 1) {
        r1 = c;
        g1 = x;
        b1 = 0;
    } else if (hh < 2) {
        r1 = x;
        g1 = c;
        b1 = 0;
    } else if (hh < 3) {
        r1 = 0;
        g1 = c;
        b1 = x;
    } else if (hh < 4) {
        r1 = 0;
        g1 = x;
        b1 = c;
    } else if (hh < 5) {
        r1 = x;
        g1 = 0;
        b1 = c;
    } else {
        r1 = c;
        g1 = 0;
        b1 = x;
    }
    const m = l - c / 2;
    const r = Math.round((r1 + m) * 255);
    const g = Math.round((g1 + m) * 255);
    const b = Math.round((b1 + m) * 255);
    return { r, g, b };
}

function hexToHsv(hex: string) {
    const { r, g, b } = hexToRgb(hex);
    const rr = r / 255;
    const gg = g / 255;
    const bb = b / 255;
    const max = Math.max(rr, gg, bb);
    const min = Math.min(rr, gg, bb);
    const d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === rr) {
            h = (gg - bb) / d + (gg < bb ? 6 : 0);
        } else if (max === gg) {
            h = (bb - rr) / d + 2;
        } else {
            h = (rr - gg) / d + 4;
        }
        h /= 6;
    }
    const s = max === 0 ? 0 : d / max;
    const v = max;
    return { h: h * 360, s, v };
}

function hsvToHex(h: number, s: number, v: number) {
    const hh = h / 60;
    const c = v * s;
    const x = c * (1 - Math.abs((hh % 2) - 1));
    let r1 = 0;
    let g1 = 0;
    let b1 = 0;
    if (hh >= 0 && hh < 1) {
        r1 = c;
        g1 = x;
        b1 = 0;
    } else if (hh < 2) {
        r1 = x;
        g1 = c;
        b1 = 0;
    } else if (hh < 3) {
        r1 = 0;
        g1 = c;
        b1 = x;
    } else if (hh < 4) {
        r1 = 0;
        g1 = x;
        b1 = c;
    } else if (hh < 5) {
        r1 = x;
        g1 = 0;
        b1 = c;
    } else {
        r1 = c;
        g1 = 0;
        b1 = x;
    }
    const m = v - c;
    return rgbToHex((r1 + m) * 255, (g1 + m) * 255, (b1 + m) * 255);
}

export type ColorPickerProps = {
    color: string;
    onChange: (hex: string) => void;
};

export function ColorPicker({ color, onChange }: ColorPickerProps) {
    const { theme } = useTheme();

    // core state
    const [hex, setHex] = useState(color);
    const [rgb, setRgb] = useState(() => hexToRgb(color));
    const [cmyk, setCmyk] = useState(() => rgbToCmyk(rgb.r, rgb.g, rgb.b));
    const [hsv, setHsv] = useState(() => hexToHsv(color));
    const [hsl, setHsl] = useState(() => rgbToHsl(rgb.r, rgb.g, rgb.b));

    const [rgbInput, setRgbInput] = useState<string>(
        `${rgb.r}, ${rgb.g}, ${rgb.b}`
    );
    const [cmykInput, setCmykInput] = useState<string>(
        `${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(
            cmyk.y * 100
        )}%, ${Math.round(cmyk.k * 100)}%`
    );
    const [hsvInput, setHsvInput] = useState<string>(
        `${Math.round(hsv.h)}°, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%`
    );
    const [hslInput, setHslInput] = useState<string>(
        `${Math.round(hsl.h)}°, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%`
    );

    useEffect(() => {
        setRgbInput(`${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }, [rgb]);

    useEffect(() => {
        setCmykInput(
            `${Math.round(cmyk.c * 100)}%, ${Math.round(cmyk.m * 100)}%, ${Math.round(
                cmyk.y * 100
            )}%, ${Math.round(cmyk.k * 100)}%`
        );
    }, [cmyk]);

    useEffect(() => {
        setHsvInput(
            `${Math.round(hsv.h)}°, ${Math.round(hsv.s * 100)}%, ${Math.round(hsv.v * 100)}%`
        );
    }, [hsv]);

    useEffect(() => {
        setHslInput(
            `${Math.round(hsl.h)}°, ${Math.round(hsl.s * 100)}%, ${Math.round(hsl.l * 100)}%`
        );
    }, [hsl]);

    // sync when prop changes
    useEffect(() => {
        if (color === hex) {
            return;
        }
        const newRgb = hexToRgb(color);
        setHex(color);
        setRgb(newRgb);
        setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
        setHsv(hexToHsv(color));
        setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    }, [color]);

    // layout refs
    const [svLayout, setSvLayout] = useState({ width: 0, height: 0 });
    const [hueLayout, setHueLayout] = useState({ width: 0 });

    // SV drag
    const handleSv = useCallback(
        (evt: GestureResponderEvent) => {
            const { locationX, locationY } = evt.nativeEvent;
            const { width, height } = svLayout;
            const newS = Math.max(0, Math.min(1, locationX / width));
            const newV = Math.max(0, Math.min(1, 1 - locationY / height));
            const newHex = hsvToHex(hsv.h, newS, newV);
            setHsv({ h: hsv.h, s: newS, v: newV });
            setHex(newHex);
        },
        [hsv.h, svLayout]
    );

    // Hue drag
    const handleHue = useCallback(
        (evt: GestureResponderEvent) => {
            const { locationX } = evt.nativeEvent;
            const { width } = hueLayout;
            const pct = Math.max(0, Math.min(1, locationX / width));
            const newH = pct * 360;
            const newHex = hsvToHex(newH, hsv.s, hsv.v);
            setHsv({ h: newH, s: hsv.s, v: hsv.v });
            setHex(newHex);
        },
        [hsv.s, hsv.v, hueLayout]
    );

    // PanResponders
    const svPan = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderGrant: handleSv,
                onPanResponderMove: handleSv,
                onPanResponderRelease: () => onChange(hex),
                onPanResponderTerminate: () => onChange(hex),
            }),
        [handleSv, hex, onChange]
    );

    const huePan = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onPanResponderGrant: handleHue,
                onPanResponderMove: handleHue,
                onPanResponderRelease: () => onChange(hex),
                onPanResponderTerminate: () => onChange(hex),
            }),
        [handleHue, hex, onChange]
    );

    // field blur handlers
    function onHexBlur(input: string) {
        const val = input.startsWith('#') ? input : `#${input}`;
        if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
            setHex(val);
            const newRgb = hexToRgb(val);
            setRgb(newRgb);
            setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
            setHsv(hexToHsv(val));
            setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
        } else {
            setHex(color);
        }
    }

    function onRgbBlur(input: string) {
        const parts = input
            .split(',')
            .map((s) => Number.parseInt(s.trim(), 10));
        if (parts.length === 3 && parts.every((v) => v >= 0 && v <= 255)) {
            const newHex = rgbToHex(parts[0], parts[1], parts[2]);
            setHex(newHex);
            setRgb({ r: parts[0], g: parts[1], b: parts[2] });
            setCmyk(rgbToCmyk(parts[0], parts[1], parts[2]));
            setHsv(hexToHsv(newHex));
            setHsl(rgbToHsl(parts[0], parts[1], parts[2]));
        } else {
            setRgb(hexToRgb(hex));
        }
    }

    function onCmykBlur(input: string) {
        const nums = input
            .split('%')
            .map((s) => Number.parseFloat(s.trim()))
            .filter((v) => !Number.isNaN(v));
        if (nums.length === 4) {
            const nc = nums[0] / 100;
            const nm = nums[1] / 100;
            const ny = nums[2] / 100;
            const nk = nums[3] / 100;
            hslToRgb(hsv.h, hsv.s, hsv.v); // fallback
            const rVal = Math.round((1 - nc) * (1 - nk) * 255);
            const gVal = Math.round((1 - nm) * (1 - nk) * 255);
            const bVal = Math.round((1 - ny) * (1 - nk) * 255);
            const newHex = rgbToHex(rVal, gVal, bVal);
            setHex(newHex);
            setRgb({ r: rVal, g: gVal, b: bVal });
            setCmyk({ c: nc, m: nm, y: ny, k: nk });
            setHsv(hexToHsv(newHex));
            setHsl(rgbToHsl(rVal, gVal, bVal));
        } else {
            setCmyk(rgbToCmyk(rgb.r, rgb.g, rgb.b));
        }
    }

    function onHsvBlur(input: string) {
        const parts = input
            .replaceAll(/[°%]/g, '')
            .split(',')
            .map((s) => Number.parseFloat(s.trim()));
        if (parts.length === 3) {
            const nh = parts[0];
            const ns = parts[1] / 100;
            const nv = parts[2] / 100;
            const newHex = hsvToHex(nh, ns, nv);
            setHex(newHex);
            setHsv({ h: nh, s: ns, v: nv });
            const newRgb = hexToRgb(newHex);
            setRgb(newRgb);
            setCmyk(rgbToCmyk(newRgb.r, newRgb.g, newRgb.b));
            setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
        } else {
            setHsv(hexToHsv(hex));
        }
    }

    function onHslBlur(input: string) {
        const parts = input
            .replaceAll(/[°%]/g, '')
            .split(',')
            .map((s) => Number.parseFloat(s.trim()));
        if (parts.length === 3) {
            const nh = parts[0];
            const ns = parts[1] / 100;
            const nl = parts[2] / 100;
            const { r: nr, g: ng, b: nb } = hslToRgb(nh, ns, nl);
            const newHex = rgbToHex(nr, ng, nb);
            setHex(newHex);
            setHsl({ h: nh, s: ns, l: nl });
            setRgb({ r: nr, g: ng, b: nb });
            setCmyk(rgbToCmyk(nr, ng, nb));
            setHsv(hexToHsv(newHex));
        } else {
            setHsl(rgbToHsl(rgb.r, rgb.g, rgb.b));
        }
    }

    return (
        <View
            style={[
                styles.container,
                { borderColor: theme.colors.SecondaryBackground },
            ]}
        >
            <Text style={[styles.header, { color: theme.colors.MainText }]}>
                Color picker
            </Text>

            <View style={styles.topRow}>
                <View style={[styles.preview, { backgroundColor: hex }]} />
                <View
                    style={styles.svBox}
                    {...svPan.panHandlers}
                    onLayout={(e: LayoutChangeEvent) => {
                        const { width, height } = e.nativeEvent.layout;

                        setSvLayout({ width, height });
                    }}
                >
                    <LinearGradient
                        colors={['#ffffff', hsvToHex(hsv.h, 1, 1)]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <LinearGradient
                        colors={['rgba(0,0,0,0)', '#000000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <View
                        style={[
                            styles.thumb,
                            {
                                left: hsv.s * svLayout.width - 8,
                                top: (1 - hsv.v) * svLayout.height - 8,
                                backgroundColor: hex, // fill the circle with the selected color
                                borderColor: '#ffffff', // white border
                                borderWidth: 2, // make it visible
                            },
                        ]}
                    />
                </View>
            </View>

            <View
                style={styles.hueSlider}
                {...huePan.panHandlers}
                onLayout={(e) => {
                    const { width } = e.nativeEvent.layout;
                    setHueLayout({ width });
                }}
            >
                <LinearGradient
                    colors={[
                        '#FF0000', // 0° red
                        '#FFFF00', // 60° yellow
                        '#00FF00', // 120° green
                        '#00FFFF', // 180° cyan
                        '#0000FF', // 240° blue
                        '#FF00FF', // 300° magenta
                        '#FF0000', // 360° red
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
                <View
                    style={[
                        styles.hueThumb,
                        {
                            left: (hsv.h / 360) * hueLayout.width - 8,
                            backgroundColor: hex, // fill the circle with the selected color
                            borderColor: '#ffffff', // white border
                            borderWidth: 2, // make it visible
                        },
                    ]}
                />
            </View>

            <FieldRow
                label="HEX"
                value={hex}
                onChangeText={setHex}
                onBlur={() => onHexBlur(hex)}
            />
            <FieldRow
                label="RGB"
                value={rgbInput}
                onChangeText={setRgbInput}
                onBlur={(e) => onRgbBlur(e.nativeEvent.text)}
            />
            <FieldRow
                label="CMYK"
                value={cmykInput}
                onChangeText={setCmykInput}
                onBlur={(e) => onCmykBlur(e.nativeEvent.text)}
            />
            <FieldRow
                label="HSV"
                value={hsvInput}
                onChangeText={setHsvInput}
                onBlur={(e) => onHsvBlur(e.nativeEvent.text)}
            />
            <FieldRow
                label="HSL"
                value={hslInput}
                onChangeText={setHslInput}
                onBlur={(e) => onHslBlur(e.nativeEvent.text)}
            />
        </View>
    );
}

function FieldRow({
    label,
    value,
    onChangeText,
    onBlur,
}: {
    label: string;
    value: string;
    onChangeText: (t: string) => void;
    onBlur: (e: { nativeEvent: { text: string } }) => void;
}) {
    const { theme } = useTheme();
    return (
        <View
            style={[
                styles.fieldRow,
                { borderColor: theme.colors.SecondaryBackground },
            ]}
        >
            <Text
                style={[
                    styles.fieldLabel,
                    { color: theme.colors.InactiveText },
                ]}
            >
                {label}
            </Text>
            <TextInput
                style={[styles.fieldInput, { color: theme.colors.MainText }]}
                value={value}
                onChangeText={onChangeText}
                onBlur={onBlur}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderWidth: 1,
        borderRadius: 6,
        padding: 12,
        marginTop: 8,
        backgroundColor: 'transparent',
    },
    header: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    topRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    preview: {
        width: 60,
        height: 60,
        borderRadius: 4,
        marginRight: 12,
        borderWidth: 1,
    },
    svBox: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 4,
        overflow: 'hidden',
    },
    thumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: 'transparent',
    },
    hueSlider: {
        height: 20,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    hueThumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        backgroundColor: 'transparent',
        top: 2,
    },
    fieldRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 6,
        marginBottom: 8,
    },
    fieldLabel: {
        width: 80,
        fontSize: 12,
        fontWeight: '600',
    },
    fieldInput: {
        flex: 1,
        fontSize: 12,
        padding: 0,
        margin: 0,
    },
});
