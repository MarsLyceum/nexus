import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

export const Circle = (style?: ViewStyle | ViewStyle[]) => (
    <Svg width={4} height={4} viewBox="0 0 4 4" fill="none" style={style}>
        <Path
            d="M4 2C4 3.10457 3.10457 4 2 4C0.89543 4 0 3.10457 0 2C0 0.89543 0.89543 0 2 0C3.10457 0 4 0.89543 4 2Z"
            fill="white"
        />
    </Svg>
);
