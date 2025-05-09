import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Cancel = ({
    style,
    color,
    size = 18,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => {
    const { theme } = useTheme();
    const fillColor = color ?? theme.colors.Error;

    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 15 15"
            fill="none"
            style={style}
        >
            <Path
                d="M8.874 7.512l5.84-5.84A.97.97 0 1013.342.296L7.5 6.138 1.66.298A.97.97 0 10.284 1.67l5.84 5.841-5.84 5.841a.97.97 0 101.374 1.374l5.84-5.84 5.842 5.84a.97.97 0 001.374 0 .97.97 0 000-1.374l-5.84-5.84z"
                fill={fillColor}
            />
        </Svg>
    );
};
