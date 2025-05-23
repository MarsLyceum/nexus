import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const Replay = ({
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
            <G clipPath="url(#clip0_538_18)" fill={fillColor}>
                <Path d="M6.389 12.933a.798.798 0 00.389.067c.155 0 .31 0 .389-.067l5.444-2.813c.233-.134.389-.335.389-.603 0-.268-.156-.47-.389-.603L7.167 6.1a.803.803 0 00-.778 0c-.233.134-.389.335-.389.603v5.627c0 .268.156.469.389.603z" />
                <Path d="M10.5 1.567l.375-.277c.375-.207.45-.621.225-.966-.225-.346-.675-.415-1.05-.207L7.8 1.497c-.15.139-.3.346-.3.553a.75.75 0 00.225.552l2.25 2.072c.15.138.3.207.525.207a.71.71 0 00.525-.207c.3-.276.3-.69 0-.967l-.9-.829c3.6.553 6.375 3.384 6.375 6.836 0 3.798-3.375 6.905-7.5 6.905s-7.5-3.107-7.5-6.905c0-2.347 1.275-4.488 3.375-5.8.375-.207.45-.621.225-.967-.225-.276-.675-.414-.975-.138C1.5 4.33 0 6.883 0 9.714 0 14.271 4.05 18 9 18s9-3.729 9-8.286c0-4.074-3.225-7.457-7.5-8.147z" />
            </G>
            <Defs>
                <ClipPath id="clip0_538_18">
                    <Path fill={fillColor} d="M0 0H18V18H0z" />
                </ClipPath>
            </Defs>
        </Svg>
    );
};
