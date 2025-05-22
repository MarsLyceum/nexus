import { StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExtraDimensions from 'react-native-extra-dimensions-android';

export type SystemBarHeights = {
    statusBarHeight: number;
    navBarHeight: number;
};

export const useSystemBars = (): SystemBarHeights => {
    // safe-area insets covers notch (iOS) and bottom home-indicator
    const insets = useSafeAreaInsets();

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
