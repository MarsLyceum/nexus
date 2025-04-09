import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { COLORS } from '../constants';

export const PaperPlane = ({
    style,
    color = COLORS.White,
    size = 18,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        fill="none"
        style={style}
    >
        <G clipPath="url(#clip0_505_9)">
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12.876 5.123l-5.94 4.124-6.213-2.07a1.058 1.058 0 01.01-2.011L16.618.051a1.059 1.059 0 011.331 1.33l-5.115 15.885a1.058 1.058 0 01-2.01.01l-2.082-6.243 4.134-5.91z"
                fill={color}
            />
        </G>
        <Defs>
            <ClipPath id="clip0_505_9">
                <Path fill={color} d="M0 0H18V18H0z" />
            </ClipPath>
        </Defs>
    </Svg>
);
