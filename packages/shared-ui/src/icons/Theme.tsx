import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Theme = ({
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
                d="M9 1.5A7.506 7.506 0 001.5 9a7.504 7.504 0 006.712 7.459c.636.066 1.163-.466 1.163-1.084v-3A.37.37 0 019.75 12h4.875c.729 0 1.46-.47 1.648-1.214.147-.582.223-1.18.227-1.783V9c0-4.138-3.362-7.5-7.5-7.5zm-2.25 3a1.13 1.13 0 011.125 1.125A1.13 1.13 0 016.75 6.75a1.13 1.13 0 01-1.125-1.125A1.13 1.13 0 016.75 4.5zm4.5 0a1.13 1.13 0 011.125 1.125A1.13 1.13 0 0111.25 6.75a1.13 1.13 0 01-1.125-1.125A1.13 1.13 0 0111.25 4.5zm-6.375 3A1.13 1.13 0 016 8.625 1.13 1.13 0 014.875 9.75 1.13 1.13 0 013.75 8.625 1.13 1.13 0 014.875 7.5zm8.25 0a1.13 1.13 0 011.125 1.125 1.13 1.13 0 01-1.125 1.125A1.13 1.13 0 0112 8.625 1.13 1.13 0 0113.125 7.5z"
                fill={fillColor}
            />
        </Svg>
    );
};
