import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { COLORS } from '../constants';

export const Comment = ({
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
        <G clipPath="url(#clip0_511_17)">
            <Path
                d="M1.8.6h14.4c.976 0 1.8.824 1.8 1.8v9.9c0 .976-.824 1.8-1.8 1.8H7.633l-2.911 3.202A.301.301 0 014.2 17.1v-3H1.8c-.976 0-1.8-.824-1.8-1.8V2.4C0 1.424.824.6 1.8.6z"
                fill={color}
            />
        </G>
        <Defs>
            <ClipPath id="clip0_511_17">
                <Path fill={color} d="M0 0H18V18H0z" />
            </ClipPath>
        </Defs>
    </Svg>
);
