import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Play = ({
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
            <G clipPath="url(#clip0_526_2)">
                <Path
                    d="M3.829.397C2.206-.534.891.229.891 2.099v13.8c0 1.873 1.315 2.635 2.938 1.705l12.063-6.918c1.623-.932 1.623-2.44 0-3.371L3.829.397z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_526_2">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
