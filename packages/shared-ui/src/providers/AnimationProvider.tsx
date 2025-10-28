import React, { useMemo } from 'react';

import {
    AnimationTimelineProvider,
    createSharedAnimationTimeline,
} from '../animation/timeline';

type AnimationProviderProps = {
    readonly children: React.ReactNode;
};

export const AnimationProvider: React.FC<AnimationProviderProps> = ({
    children,
}) => {
    const animationTimeline = useMemo(
        () => createSharedAnimationTimeline(),
        []
    );

    return (
        <AnimationTimelineProvider timeline={animationTimeline}>
            {children}
        </AnimationTimelineProvider>
    );
};
