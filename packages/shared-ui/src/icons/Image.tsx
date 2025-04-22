import * as React from 'react';
import Svg, { Path } from 'react-native-svg';
import { ViewStyle } from 'react-native';

import { useTheme } from '../theme';

export const ImageIcon = ({
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
            <Path
                d="M.522 15.309l-.018.018a5.568 5.568 0 01-.46-1.8c.064.657.235 1.251.478 1.782zM6.3 7.542a2.142 2.142 0 100-4.284 2.142 2.142 0 000 4.284z"
                fill={fillColor}
            />
            <Path
                d="M12.771 0H5.229C1.953 0 0 1.953 0 5.229v7.542c0 .981.171 1.836.504 2.556C1.278 17.037 2.934 18 5.229 18h7.542C16.047 18 18 16.047 18 12.771V5.229C18 1.953 16.047 0 12.771 0zm3.762 9.45c-.702-.603-1.836-.603-2.538 0l-3.744 3.213c-.702.603-1.836.603-2.538 0l-.306-.252c-.639-.558-1.656-.612-2.376-.126l-3.366 2.259a4.8 4.8 0 01-.315-1.773V5.229c0-2.538 1.341-3.879 3.879-3.879h7.542c2.538 0 3.879 1.341 3.879 3.879v4.32l-.117-.099z"
                fill={fillColor}
            />
        </Svg>
    );
};
