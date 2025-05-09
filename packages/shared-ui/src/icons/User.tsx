import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export function UserIcon({
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
                d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"
                stroke={fillColor}
                strokeOpacity={0.2}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}
