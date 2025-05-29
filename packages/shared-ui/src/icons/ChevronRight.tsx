import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const ChevronRight = ({
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
            <G clipPath="url(#clip0_544_25)">
                <Path
                    d="M4.267 16.08L11.347 9l-7.08-7.08A1.125 1.125 0 115.858.33l7.875 7.875a1.125 1.125 0 010 1.59l-7.875 7.876a1.125 1.125 0 01-1.59-1.591z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_544_25">
                    <Path
                        fill={fillColor}
                        transform="rotate(180 9 9)"
                        d="M0 0H18V18H0z"
                    />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
