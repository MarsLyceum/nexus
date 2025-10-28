import { useMemo } from 'react';

import { useSceneRenderer } from './sceneRenderer';

export const useAnimationManager = () =>
    useMemo(
        () => ({
            render: useSceneRenderer,
        }),
        []
    );
