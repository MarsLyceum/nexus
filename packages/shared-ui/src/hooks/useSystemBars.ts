import { useState, useEffect } from 'react';
import {
    Dimensions,
    ScaledSize,
    StatusBar,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExtraDimensions from 'react-native-extra-dimensions-android';

export type SystemBarHeights = {
    statusBarHeight: number;
    navBarHeight: number;
};

export const useSystemBars = (): SystemBarHeights => {
    // safe-area insets covers notch (iOS) and bottom home-indicator
    const insets = useSafeAreaInsets();

    // window dims update automatically on rotation
    const window = useWindowDimensions();

    // screen dims we’ll watch manually so we can diff window vs screen
    const [screen, setScreen] = useState<ScaledSize>(Dimensions.get('screen'));

    useEffect(() => {
        // listen for any dimension change (rotation, split-screen, etc)
        const sub = Dimensions.addEventListener(
            'change',
            ({ screen: newScreen }) => {
                setScreen(newScreen);
            }
        );
        return () => {
            sub.remove();
        };
    }, []);

    // on iOS the safe-area top inset IS the status-bar/notch height
    // on Android StatusBar.currentHeight is your status bar height
    const statusBarHeight =
        Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight ?? 0;

    // Android nav-bar = screen.height – window.height – statusBar
    // iOS “nav bar” we usually care about is the bottom home-indicator inset
    const navBarHeight =
        Platform.OS === 'android'
            ? ExtraDimensions.get('SOFT_MENU_BAR_HEIGHT')
            : insets.bottom;

    return { statusBarHeight, navBarHeight };
};
