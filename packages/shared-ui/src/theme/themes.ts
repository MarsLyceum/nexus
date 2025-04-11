// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
// src/theme/themes.ts
import { COLORS as DefaultColors } from '../constants/colors';

import { Monochrome } from './monochrome';
import { DualTone } from './dual-tone';
import { NatureInspired } from './nature-inspired';
import { PastelDreams } from './pastel-dreams';
import { NeonPulse } from './neon-pulse';

export type Theme = {
    name: string;
    colors: typeof DefaultColors;
};

export const themesByCategory: Record<string, Theme[]> = {
    Monochrome,
    'Dual Tone': DualTone,
    'Nature Inspired': NatureInspired,
    'Pastel Dreams': PastelDreams,
    'Neon Pulse': NeonPulse,
};
