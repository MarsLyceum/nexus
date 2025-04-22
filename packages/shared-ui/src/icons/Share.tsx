import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Share = ({
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
                d="M.776 15.78c1.749-3.252 3.72-5.715 9.385-5.469.098 0 .246.148.246.247v2.463c0 .173.246.493.493.247L17.476 7.7a.185.185 0 000-.295L10.9 2.182c-.124-.099-.493 0-.493.246v2.463c0 .099-.148.247-.246.247C.308 6.123.825 13.76.456 15.608c-.05.197.222.345.32.172z"
                fill={fillColor}
            />
        </Svg>
    );
};
