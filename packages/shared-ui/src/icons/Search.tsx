import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Search = ({
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
            <G clipPath="url(#clip0_325_2)">
                <Path
                    d="M17.574 15.605l-4.139-4.195a7.41 7.41 0 001.112-3.916c0-4.072-3.257-7.372-7.274-7.372C3.256.122 0 3.422 0 7.494c0 4.073 3.256 7.373 7.273 7.373 1.545 0 2.977-.49 4.154-1.322l4.09 4.146a1.44 1.44 0 002.057 0 1.49 1.49 0 000-2.086zm-10.3-3.127c-2.716 0-4.917-2.231-4.917-4.983 0-2.753 2.201-4.984 4.916-4.984 2.715 0 4.917 2.231 4.917 4.984 0 2.752-2.202 4.983-4.917 4.983z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_325_2">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
