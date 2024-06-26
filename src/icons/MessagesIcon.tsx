import * as React from 'react';
import Svg, { G, Path, Line, Defs, ClipPath, Rect } from 'react-native-svg';

export const MessagesIcon = (props) => (
    <Svg
        width={29}
        height={28}
        viewBox="0 0 29 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <G clipPath="url(#clip0_685_7374)">
            <Path
                d="M27.2595 13.5174C27.2595 19.2942 21.8496 23.9772 15.1761 23.9772C11.5672 23.9772 3.09281 23.9772 3.09281 23.9772C3.09281 23.9772 3.09281 16.1701 3.09281 13.5174C3.09281 7.74061 8.5027 3.05762 15.1761 3.05762C21.8496 3.05762 27.2595 7.74061 27.2595 13.5174Z"
                fill="white"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M9.13448 10.3799H20.0095"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M9.13448 14.5635H20.0095"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Path
                d="M9.13448 18.7471H15.1762"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <Line
                x1={8.483_84}
                y1={16.8789}
                x2={19.7067}
                y2={16.8789}
                stroke="#C4C4C4"
            />
            <Line
                x1={9.599_23}
                y1={13.0176}
                x2={20.8221}
                y2={13.0176}
                stroke="#C4C4C4"
            />
            <Line
                x1={11.83}
                y1={9.155_27}
                x2={23.0529}
                y2={9.155_27}
                stroke="#C4C4C4"
            />
        </G>
        <Defs>
            <ClipPath id="clip0_685_7374">
                <Rect width={29} height={28} fill="white" />
            </ClipPath>
        </Defs>
    </Svg>
);
