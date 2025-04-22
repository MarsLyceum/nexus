import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const UpArrow = ({
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
            <G clipPath="url(#clip0_509_7)">
                <Path
                    d="M16.07 6.598a.39.39 0 01-.007-.006L9.77.292a.98.98 0 00-.165-.133l-.18-.098L9.3.019H9.21a1.162 1.162 0 00-.42 0h-.182l-.14.075a.997.997 0 00-.213.156L1.937 6.592a1.079 1.079 0 00-.006 1.526l.006.006a1.104 1.104 0 001.524 0l3.764-3.756a.412.412 0 01.7.289V16.92a1.079 1.079 0 102.158 0V4.657a.412.412 0 01.7-.289l3.748 3.756a1.104 1.104 0 001.532 0c.423-.42.426-1.103.006-1.526z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_509_7">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
