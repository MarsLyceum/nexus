import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Flair = ({
    style,
    color,
    size = 18,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => {
    const { theme } = useTheme();
    const fillColor = color ?? theme.colors.ActiveText;

    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 18 18"
            fill="none"
            style={style}
        >
            <G clipPath="url(#clip0_551_2)">
                <Path
                    d="M16.5 0h-6.234c-.413 0-.99.239-1.28.53L.437 9.078a1.504 1.504 0 000 2.12l6.364 6.365a1.503 1.503 0 002.12 0l8.548-8.547c.291-.291.53-.869.53-1.28V1.5c0-.825-.675-1.5-1.5-1.5zm-3 6A1.5 1.5 0 1113.501 3 1.5 1.5 0 0113.5 6z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_551_2">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
