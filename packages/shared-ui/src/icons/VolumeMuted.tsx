import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const VolumeMuted = ({
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
            <G clipPath="url(#clip0_529_2)" fill={fillColor}>
                <Path d="M10.198 18.35c.143.113.32.166.497.166.132 0 .269-.03.389-.095a.913.913 0 00.469-.8V1.413a.913.913 0 00-.469-.8.824.824 0 00-.886.072L4.162 5.178H1.14c-.475 0-.858.406-.858.896v6.886c0 .49.383.896.858.896h3.023l6.036 4.493zM17.749 7.164a.832.832 0 00-1.212 0l-1.042 1.087-1.041-1.087a.832.832 0 00-1.213 0 .923.923 0 000 1.266l1.042 1.087-1.041 1.087a.923.923 0 000 1.266.837.837 0 00.606.262c.22 0 .438-.087.606-.262l1.041-1.087 1.042 1.087a.836.836 0 00.606.262c.219 0 .438-.087.606-.262a.923.923 0 000-1.266l-1.041-1.087 1.04-1.087a.923.923 0 000-1.266z" />
            </G>
            <Defs>
                <ClipPath id="clip0_529_2">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
