import React, { useMemo } from 'react';
import { Platform } from 'react-native';

import { createGlowKeyframes } from '../../utils';

type GlowKeyframesProps = {
    color: string;
    focal?: { x: number; y: number };
};

export const GlowKeyframes: React.FC<GlowKeyframesProps> = ({
    color,
    focal,
}) => {
    const keyframes = useMemo(
        () =>
            Platform.OS === 'web' ? createGlowKeyframes(color, { focal }) : '',
        [color, focal]
    );

    if (Platform.OS !== 'web') {
        return null;
    }

    return <style>{keyframes}</style>;
};
