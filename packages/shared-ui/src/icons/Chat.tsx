import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Chat = ({
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
            viewBox="0 0 15 15"
            fill="none"
            style={style}
        >
            <Path
                d="M2.184 14.104H1.12l.752-.752c.405-.405.658-.932.726-1.504C.864 10.709 0 9.059 0 7.33 0 4.14 2.933.897 7.525.897 12.391.897 15 3.88 15 7.05c0 3.191-2.637 6.173-7.475 6.173-.847 0-1.731-.113-2.521-.32a3.939 3.939 0 01-2.82 1.2z"
                fill={fillColor}
            />
        </Svg>
    );
};
