import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const ChevronLeft = ({
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
            <G clipPath="url(#clip0_543_22)">
                <Path
                    d="M13.733 1.92L6.653 9l7.08 7.08a1.125 1.125 0 11-1.591 1.59L4.267 9.796a1.125 1.125 0 010-1.59L12.142.33a1.125 1.125 0 011.591 1.59z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_543_22">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
