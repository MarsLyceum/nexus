import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const MoreHorizontal = ({
    style,
    color,
    size = 20,
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
            viewBox="0 0 20 20"
            fill="none"
            style={style}
        >
            <Path
                d="M19.268 8.232a2.5 2.5 0 11-3.536 3.536 2.5 2.5 0 013.536-3.536zM11.768 8.232a2.5 2.5 0 11-3.536 3.536 2.5 2.5 0 013.536-3.536zM4.268 8.232a2.5 2.5 0 11-3.536 3.536 2.5 2.5 0 013.536-3.536z"
                fill={fillColor}
            />
        </Svg>
    );
};
