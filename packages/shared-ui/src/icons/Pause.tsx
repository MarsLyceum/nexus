import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Pause = ({
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
                d="M6.802 15.493a2.507 2.507 0 01-5.014 0V2.507a2.507 2.507 0 015.014 0v12.986zM16.212 15.493a2.507 2.507 0 01-5.015 0V2.507a2.508 2.508 0 015.015 0v12.986z"
                fill={fillColor}
            />
        </Svg>
    );
};
