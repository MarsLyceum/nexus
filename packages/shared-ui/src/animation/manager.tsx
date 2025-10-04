import { useMemo } from 'react';

import { renderAnimationScene } from './scenes';

export const useAnimationManager = () =>
    useMemo(() => ({ render: renderAnimationScene }), []);
