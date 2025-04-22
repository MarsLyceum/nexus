import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export function Phone({
    style,
}: Readonly<{ style?: ViewStyle | ViewStyle[] }>) {
    const { theme } = useTheme();
    const fillColor = theme.colors.ActiveText;

    return (
        <Svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            style={style}
        >
            <Path
                d="M17 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2zM12 18h.01"
                stroke={fillColor}
                strokeOpacity={0.3}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
