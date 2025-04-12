import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const MoreVertical = ({
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
                d="M7.5 3.75a1.406 1.406 0 100-2.813 1.406 1.406 0 000 2.813zM7.5 8.906a1.406 1.406 0 100-2.812 1.406 1.406 0 000 2.812zM7.5 14.063a1.406 1.406 0 100-2.813 1.406 1.406 0 000 2.813z"
                fill={fillColor}
            />
        </Svg>
    );
};
