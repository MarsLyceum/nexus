import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const DownArrow = ({
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
            <G clipPath="url(#clip0_510_12)">
                <Path
                    d="M1.931 11.402a.25.25 0 00.006.006l6.293 6.3c.05.05.105.095.165.133l.18.098.124.042h.091c.139.025.281.025.42 0h.182l.14-.075a.996.996 0 00.213-.156l6.318-6.342c.423-.42.426-1.103.006-1.526l-.006-.006a1.104 1.104 0 00-1.524 0l-3.764 3.756a.412.412 0 01-.7-.289V1.08a1.079 1.079 0 10-2.158 0v12.264a.412.412 0 01-.7.289L3.469 9.876a1.104 1.104 0 00-1.532 0 1.079 1.079 0 00-.006 1.526z"
                    fill={fillColor}
                />
            </G>
            <Defs>
                <ClipPath id="clip0_510_12">
                    <Path
                        fill={fillColor}
                        transform="rotate(180 9 9)"
                        d="M0 0H18V18H0z"
                    />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
