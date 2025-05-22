import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const FullScreen = ({
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
            <G clipPath="url(#clip0_534_9)" fill={fillColor}>
                <Path d="M6.136 0H.41A.409.409 0 000 .41v5.726c0 .226.183.41.41.41h.817c.226 0 .41-.184.41-.41v-4.5h4.5c.225 0 .408-.183.408-.409V.41A.409.409 0 006.136 0zM17.59 0h-5.726a.409.409 0 00-.41.41v.817c0 .226.183.41.41.41h4.5v4.5c0 .225.183.408.409.408h.818c.226 0 .409-.183.409-.409V.41A.409.409 0 0017.59 0zM17.59 11.455h-.817a.409.409 0 00-.41.409v4.5h-4.5a.409.409 0 00-.409.409v.818c0 .226.183.409.41.409h5.727c.226 0 .409-.183.409-.41v-5.726a.409.409 0 00-.41-.41zM6.136 16.364h-4.5v-4.5a.409.409 0 00-.409-.41H.41a.409.409 0 00-.409.41v5.727c0 .226.183.409.41.409h5.726c.226 0 .41-.183.41-.41v-.817a.409.409 0 00-.41-.41z" />
            </G>
            <Defs>
                <ClipPath id="clip0_534_9">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
