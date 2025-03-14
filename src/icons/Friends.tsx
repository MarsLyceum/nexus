import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { COLORS } from '../constants';

export const Friends = ({
    style,
    color = COLORS.White,
    size = 18,
}: {
    style?: ViewStyle | ViewStyle[];
    color?: string;
    size?: number;
}) => (
    <Svg width={size} height={size} viewBox="0 0 15 15" style={style}>
        <Path
            d="M4.55 1.674c-1.51 0-2.737 1.302-2.737 2.903 0 1.6 1.228 2.903 2.738 2.903s2.738-1.302 2.738-2.903c0-1.6-1.229-2.903-2.738-2.903zM10.775 2.09h-.018a2.271 2.271 0 00-1.667.753 2.549 2.549 0 00-.663 1.753 2.55 2.55 0 00.692 1.743 2.272 2.272 0 001.66.726h.019a2.272 2.272 0 001.666-.754 2.55 2.55 0 00.664-1.753c-.012-1.365-1.065-2.469-2.353-2.469zM10.89 7.54h-.226a4.094 4.094 0 00-2.755 1.062 5.295 5.295 0 012.064 3.922H15v-.875a4.114 4.114 0 00-4.11-4.11zM9.092 12.524a4.407 4.407 0 00-1.77-3.264 4.393 4.393 0 00-2.635-.872h-.273A4.414 4.414 0 000 12.802v.524h9.101v-.524c0-.093-.003-.186-.009-.278z"
            fill={color}
        />
    </Svg>
);
