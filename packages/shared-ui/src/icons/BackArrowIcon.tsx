import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { COLORS } from '../constants';

export const BackArrowIcon = ({
    style,
    color = COLORS.White,
    size = 24,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={style}
    >
        <G clipPath="url(#clip0_509_2)">
            <Path
                d="M22.558 10.315a1.718 1.718 0 00-.298-.022H5.33l.37-.171c.36-.171.688-.404.97-.687l4.747-4.748c.626-.597.73-1.557.25-2.275a1.717 1.717 0 00-2.576-.224L.504 10.774a1.717 1.717 0 00-.002 2.429l.002.001L9.09 21.79a1.717 1.717 0 002.575-.172 1.777 1.777 0 00-.249-2.275l-4.74-4.757a3.435 3.435 0 00-.858-.626l-.515-.232h16.863a1.777 1.777 0 001.812-1.443 1.717 1.717 0 00-1.42-1.97z"
                fill={color}
            />
        </G>
        <Defs>
            <ClipPath id="clip0_509_2">
                <Path fill={color} d="M0 0H24V24H0z" />
            </ClipPath>
        </Defs>
    </Svg>
);
