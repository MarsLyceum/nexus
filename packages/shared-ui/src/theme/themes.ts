// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
// src/theme/themes.ts
import { COLORS as DefaultColors } from '../constants/colors';

import { Monochrome } from './theme-definitions/monochrome';
import { DualTone } from './theme-definitions/dual-tone';
import { NatureInspired } from './theme-definitions/nature-inspired';
import { PastelDreams } from './theme-definitions/pastel-dreams';
import { NeonPulse } from './theme-definitions/neon-pulse';
import { DarkThemes } from './theme-definitions/dark-themes';
import { LightThemes } from './theme-definitions/light-themes';

export type Theme = {
    name: string;
    colors: typeof DefaultColors;
};

export const themesByCategory: Record<string, Theme[]> = {
    Monochrome,
    'Dark Themes': DarkThemes,
    'Light Themes': LightThemes,
    'Dual Tone': DualTone,
    'Nature Inspired': NatureInspired,
    'Pastel Dreams': PastelDreams,
    'Neon Pulse': NeonPulse,
};
