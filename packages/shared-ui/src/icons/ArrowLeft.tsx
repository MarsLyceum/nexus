import * as React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export const ArrowLeft = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M15.2071 18.7071C14.8166 19.0976 14.1834 19.0976 13.7929 18.7071L7.79289 12.7071C7.40237 12.3166 7.40237 11.6834 7.79289 11.2929L13.7929 5.29289C14.1834 4.90237 14.8166 4.90237 15.2071 5.29289C15.5976 5.68342 15.5976 6.31658 15.2071 6.70711L9.91421 12L15.2071 17.2929C15.5976 17.6834 15.5976 18.3166 15.2071 18.7071Z"
            fill="url(#paint0_linear_509_658)"
        />
        <Defs>
            <LinearGradient
                id="paint0_linear_509_658"
                x1={12.4627}
                y1={10.375}
                x2={5.582_24}
                y2={13.2256}
                gradientUnits="userSpaceOnUse"
            >
                <Stop stopColor="#A3109E" />
                <Stop offset={1} stopColor="#FF3A0F" />
                <Stop offset={1} stopColor="#F83916" />
            </LinearGradient>
        </Defs>
    </Svg>
);
