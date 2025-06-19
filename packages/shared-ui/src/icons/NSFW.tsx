import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const NSFW = ({
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
            <G clipPath="url(#clip0_554_11)" fill={fillColor}>
                <Path d="M5.694 12.065V7.178h-1.13V5.926h2.689v6.14H5.694zM13.111 7.511c0 .534-.288 1.007-.77 1.27.674.28 1.095.867 1.095 1.55 0 1.104-.981 1.804-2.514 1.804-1.532 0-2.513-.692-2.513-1.778 0-.7.455-1.296 1.164-1.576-.516-.289-.849-.78-.849-1.314 0-.98.858-1.602 2.19-1.602 1.348 0 2.197.639 2.197 1.646zM9.88 10.2c0 .517.368.806 1.042.806.675 0 1.051-.28 1.051-.806 0-.508-.377-.797-1.05-.797-.675 0-1.043.289-1.043.797zm.158-2.601c0 .438.315.683.884.683.57 0 .885-.245.885-.683 0-.456-.316-.71-.885-.71-.57 0-.884.254-.884.71z" />
                <Path d="M16.03 6.62c.259.764.39 1.564.39 2.38 0 4.091-3.329 7.42-7.42 7.42-4.092 0-7.42-3.329-7.42-7.42 0-4.092 3.328-7.42 7.42-7.42.816 0 1.616.131 2.38.39V.32A8.989 8.989 0 009 0C4.037 0 0 4.037 0 9s4.037 9 9 9 9-4.037 9-9c0-.81-.108-1.608-.32-2.38h-1.65z" />
                <Path d="M15.58 2.414V.69h-1.24v1.725h-1.716v1.241h1.715v1.726h1.241V3.655h1.726v-1.24H15.58z" />
            </G>
            <Defs>
                <ClipPath id="clip0_554_11">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
