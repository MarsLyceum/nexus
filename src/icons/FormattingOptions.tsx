import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { COLORS } from '../constants';

export const FormattingOptions = ({
    style,
    color = COLORS.White,
    size = 18,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        fill="none"
        style={style}
    >
        <G
            clipPath="url(#clip0_328_9)"
            fillRule="evenodd"
            clipRule="evenodd"
            fill={color}
        >
            <Path d="M7.426 2.438c.254 0 .484.178.58.451l2.93 8.27.857 2.418.011.03 2.063 5.823c.132.372-.02.799-.341.952-.321.154-.688-.024-.82-.397L10.798 14.6H4.054l-1.908 5.385c-.132.373-.499.55-.82.397-.32-.153-.473-.58-.341-.952l2.063-5.822a.797.797 0 01.01-.031L6.846 2.889c.097-.273.327-.451.581-.451zM4.572 13.14h5.708L7.426 5.084 4.572 13.14zM10.984 4.14c0-.403.281-.73.628-.73h6.698c.346 0 .628.327.628.73 0 .403-.282.73-.628.73h-6.698c-.347 0-.628-.327-.628-.73zM12.658 9.005c0-.403.282-.73.628-.73h5.024c.346 0 .628.327.628.73 0 .403-.282.73-.628.73h-5.024c-.346 0-.628-.327-.628-.73zM14.333 13.87c0-.403.281-.73.628-.73h3.349c.346 0 .628.327.628.73 0 .403-.282.73-.628.73h-3.35c-.346 0-.627-.327-.627-.73z" />
        </G>
        <Defs>
            <ClipPath id="clip0_328_9">
                <Path fill={color} d="M0 0H18V18H0z" />
            </ClipPath>
        </Defs>
    </Svg>
);
