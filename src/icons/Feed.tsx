import * as React from 'react';
import Svg, { Path, G, Defs, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface FeedProps {
    style?: ViewStyle | ViewStyle[];
    color: string;
    size?: number;
}

export const Feed: React.FC<FeedProps> = ({ style, color, size = 18 }) => (
    <Svg
        width={size}
        height={size}
        viewBox="0 0 15 15"
        fill="none"
        style={style}
    >
        <G clipPath="url(#clip0_176_118)">
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M.938 4.679V2.335C.938 1.56 1.567.93 2.343.93h10.312c.777 0 1.406.63 1.406 1.405V4.68H.938zm13.124.937v7.029c0 .776-.629 1.406-1.406 1.406H2.344c-.777 0-1.406-.63-1.406-1.406v-7.03h13.124zM3.283 3.74h2.343a.469.469 0 100-.937H3.281a.469.469 0 000 .937zm4.687 0h.937a.469.469 0 100-.937H7.97a.469.469 0 000 .937zm2.812 0h.938a.469.469 0 100-.937h-.938a.469.469 0 000 .937zM6.562 6.553H4.22a1.406 1.406 0 00-1.407 1.406v2.812a1.406 1.406 0 001.407 1.405h2.343a1.406 1.406 0 001.407-1.405V7.959a1.405 1.405 0 00-1.407-1.406zm0 .937a.468.468 0 01.47.469v2.812a.467.467 0 01-.47.468H4.22a.469.469 0 01-.469-.468V7.959a.468.468 0 01.469-.469h2.343zm2.813 2.343h2.344a.469.469 0 100-.937H9.375a.469.469 0 000 .937zm0 1.64h2.344a.469.469 0 100-.937H9.375a.469.469 0 000 .937zm0-3.28h2.344a.469.469 0 000-.937H9.375a.47.47 0 000 .937z"
                fill={color}
            />
        </G>
        <Defs>
            <ClipPath id="clip0_176_118">
                <Path fill={color} d="M0 0H15V15H0z" />
            </ClipPath>
        </Defs>
    </Svg>
);
