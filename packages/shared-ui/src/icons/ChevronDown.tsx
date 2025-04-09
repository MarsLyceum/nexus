import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { COLORS } from '../constants';

export const ChevronDown = ({
    style,
    color = COLORS.White,
    size = 14,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 14 14"
        fill="none"
        style={style}
    >
        <Path
            d="M10.908 4.842a.564.564 0 00-.816 0L7 7.933 3.908 4.842a.564.564 0 00-.816 0 .564.564 0 000 .816l3.5 3.5A.63.63 0 007 9.333a.63.63 0 00.408-.175l3.5-3.5a.564.564 0 000-.816z"
            fill={color}
        />
    </Svg>
);
