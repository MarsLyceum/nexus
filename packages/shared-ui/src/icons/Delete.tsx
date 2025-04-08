import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';
import { COLORS } from '../constants';

export const Delete = ({
    style,
    color = COLORS.Error,
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
        <Path
            d="M2.187 5.273L3.12 16.55A1.59 1.59 0 004.697 18h8.606a1.59 1.59 0 001.576-1.45l.934-11.277H2.187zm4.176 10.618a.527.527 0 01-.526-.495L5.31 6.888a.527.527 0 01.493-.559.52.52 0 01.56.493l.527 8.508a.528.528 0 01-.527.56zm3.164-.528a.527.527 0 11-1.054 0V6.855a.527.527 0 111.054 0v8.508zm3.163-8.475l-.527 8.508a.526.526 0 11-1.053-.066l.528-8.507a.536.536 0 01.559-.494c.29.018.511.268.493.56zM15.855 2.11h-3.164v-.528C12.691.71 11.981 0 11.11 0H6.891c-.873 0-1.582.71-1.582 1.582v.527H2.145a1.055 1.055 0 100 2.11h13.71a1.055 1.055 0 000-2.11zm-4.218 0H6.363v-.528c0-.29.237-.527.528-.527h4.218c.291 0 .528.236.528.527v.527z"
            fill={color}
        />
    </Svg>
);
