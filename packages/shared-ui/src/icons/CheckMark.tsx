import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const CheckMark = ({
    style,
    color,
    size = 18,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => {
    const { theme } = useTheme();
    const fillColor = color ?? theme.colors.Success;

    return (
        <Svg
            width={size}
            height={size}
            viewBox="0 0 15 15"
            fill="none"
            style={style}
        >
            <G clipPath="url(#clip0_302_148)">
                <Path
                    d="M14.652.484c-.465-.646-1.218-.645-1.683 0L5.397 11.008 2.03 6.33c-.464-.646-1.218-.646-1.682 0-.465.646-.465 1.693 0 2.338l4.206 5.846c.232.323.537.485.841.485.305 0 .61-.161.842-.485l8.413-11.692c.465-.646.465-1.693 0-2.339z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_302_148">
                    <Path fill={fillColor} d="M0 0H15V15H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
