import * as React from 'react';
import Svg, { Path, Defs, G, ClipPath } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface FeedProps {
    style?: ViewStyle | ViewStyle[];
    color: string;
}

export const Feed: React.FC<FeedProps> = ({ style, color }) => (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={style}>
        <G clipPath="url(#clip0_75_103)" fill={color}>
            <Path d="M0 2.113a.84.84 0 01.84-.84H7.99a.42.42 0 010 .84H.84v12.614h14.295V7.579a.42.42 0 01.841 0v7.148a.84.84 0 01-.84.84H.84a.84.84 0 01-.841-.84V2.113z" />
            <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M14.326 1.275c-.19-.012-.409.05-.625.267L7.259 7.984l-.198 1.387 1.388-.198 6.441-6.441c.217-.217.28-.436.268-.626a.888.888 0 00-.268-.564.887.887 0 00-.564-.267zm1.671.782c.026.441-.134.891-.512 1.27L9.042 9.768a.835.835 0 01-.475.237l-1.387.198a.84.84 0 01-.951-.951l.198-1.388a.84.84 0 01.238-.476L13.106.948c.378-.378.828-.539 1.27-.513.431.026.822.226 1.109.513.286.286.487.677.512 1.109z"
            />
        </G>
        <Defs>
            <ClipPath id="clip0_75_103">
                <Path fill="#fff" d="M0 0H16V16H0z" />
            </ClipPath>
        </Defs>
    </Svg>
);
