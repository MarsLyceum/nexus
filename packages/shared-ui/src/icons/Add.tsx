import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Add = ({
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
            <G clipPath="url(#clip0_327_6)">
                <Path
                    d="M16.393 7.393h-5.464a.322.322 0 01-.322-.322V1.607a1.607 1.607 0 00-3.214 0v5.464a.321.321 0 01-.322.322H1.607a1.607 1.607 0 000 3.214h5.464c.178 0 .322.144.322.322v5.464a1.607 1.607 0 003.214 0v-5.464c0-.178.144-.322.322-.322h5.464a1.607 1.607 0 000-3.214z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_327_6">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
