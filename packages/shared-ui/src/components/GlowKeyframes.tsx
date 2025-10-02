import React, { useMemo } from 'react';
import { Platform } from 'react-native';

import { createGlowKeyframes } from '../utils';

type GlowKeyframesProps = {
    color: string;
};

export const GlowKeyframes: React.FC<GlowKeyframesProps> = ({ color }) => {
    const keyframes = useMemo(
        () => (Platform.OS === 'web' ? createGlowKeyframes(color) : ''),
        [color]
    );

    if (Platform.OS !== 'web') {
        return null;
    }

    return <style>{keyframes}</style>;
};
