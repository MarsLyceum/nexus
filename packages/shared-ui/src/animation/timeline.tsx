import React, { createContext, useContext } from 'react';

type Clock = () => number;

const selectClock = (): Clock => {
    if (
        typeof performance !== 'undefined' &&
        typeof performance.now === 'function'
    ) {
        return () => performance.now();
    }
    return () => Date.now();
};

const toSeconds = (milliseconds: number): number => milliseconds / 1000;

export type SharedAnimationTimeline = {
    readonly getTimeSeconds: () => number;
    readonly reset: () => void;
};

export const createSharedAnimationTimeline = (
    clock: Clock = selectClock()
): SharedAnimationTimeline => {
    let origin = clock();
    return {
        getTimeSeconds: () => toSeconds(clock() - origin),
        reset: () => {
            origin = clock();
        },
    };
};

const AnimationTimelineContext = createContext<
    SharedAnimationTimeline | undefined
>(undefined);

export const AnimationTimelineProvider: React.FC<{
    readonly timeline: SharedAnimationTimeline;
    readonly children: React.ReactNode;
}> = ({ timeline, children }) => (
    <AnimationTimelineContext.Provider value={timeline}>
        {children}
    </AnimationTimelineContext.Provider>
);

export const useAnimationTimeline = (): SharedAnimationTimeline => {
    const timeline = useContext(AnimationTimelineContext);
    if (!timeline) {
        throw new Error(
            'useAnimationTimeline must be used within AnimationTimelineProvider'
        );
    }
    return timeline;
};
