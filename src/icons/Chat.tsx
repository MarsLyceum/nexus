import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export const Chat = (style?: ViewStyle | ViewStyle[]) => (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={style}>
        <Path
            d="M2.33 15.044H1.196l.802-.802c.432-.432.702-.994.774-1.604C.922 11.423 0 9.663 0 7.818 0 4.416 3.128.957 8.027.957 13.217.956 16 4.14 16 7.52c0 3.404-2.812 6.585-7.973 6.585-.904 0-1.847-.121-2.69-.343a4.201 4.201 0 01-3.007 1.282z"
            fill="#fff"
        />
    </Svg>
);
