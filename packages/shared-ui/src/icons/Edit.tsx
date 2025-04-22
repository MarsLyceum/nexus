import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Edit = ({
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
                d="M10.533 4.517l-8.575 8.575c-.316.316-.515.73-.566 1.175l-.342 3a1.508 1.508 0 001.508 1.666h.175l3-.341a2.017 2.017 0 001.175-.559l8.575-8.583-4.95-4.933zM18.383 3.792l-2.175-2.175a1.959 1.959 0 00-2.775 0l-2.016 2.016 4.95 4.95 2.016-2.016a1.96 1.96 0 000-2.775z"
                fill={fillColor}
            />
        </Svg>
    );
};
