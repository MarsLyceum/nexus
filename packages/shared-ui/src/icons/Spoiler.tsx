import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Spoiler = ({
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
            <Path
                d="M1 9s4-6 8-6 8 6 8 6-4 6-8 6-8-6-8-6z"
                stroke={fillColor}
            />
            <Path
                d="M9 11a2 2 0 100-4 2 2 0 000 4zM4 14L14 4"
                stroke={fillColor}
            />
        </Svg>
    );
};
