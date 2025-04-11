// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
// src/theme/monochrome.ts
import { COLORS as DefaultColors } from '../constants/colors';
import type { Theme } from './themes';

export const Monochrome: Theme[] = [
    {
        name: 'Nexus Original',
        colors: {
            ...DefaultColors,
        },
    },
    {
        name: 'Red Radiance',
        colors: {
            ...DefaultColors,
            Primary: '#FF0000',
            Secondary: '#FF4D4D',
            Tertiary: '#FF9999',
            PrimaryBackground: '#3B0000',
            SecondaryBackground: '#500000',
            TertiaryBackground: '#660000',
            AppBackground: '#290000',
            TextInput: '#4A1A1A',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Orange Ember',
        colors: {
            ...DefaultColors,
            Primary: '#FF7F00',
            Secondary: '#FF9933',
            Tertiary: '#FFCC99',
            PrimaryBackground: '#5A2E00', // richer orange
            SecondaryBackground: '#7A4200',
            TertiaryBackground: '#9A5800',
            AppBackground: '#4D2600',
            TextInput: '#663800',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Yellow Glow',
        colors: {
            ...DefaultColors,
            Primary: '#FFFF33',
            Secondary: '#FFFF99',
            Tertiary: '#FFFFCC',
            PrimaryBackground: '#4D4400',
            SecondaryBackground: '#665C00',
            TertiaryBackground: '#807300',
            AppBackground: '#3F3300',
            TextInput: '#665900',
            ActiveText: '#FFFFFF',
            MainText: '#DDDDDD',
        },
    },
    {
        name: 'Green Meadow',
        colors: {
            ...DefaultColors,
            Primary: '#00F200',
            Secondary: '#00AA00',
            Tertiary: '#A5D5A5',
            PrimaryBackground: '#1A311A',
            SecondaryBackground: '#234823',
            TertiaryBackground: '#245724',
            AppBackground: '#152315',
            TextInput: '#294A29',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Cyan Tide',
        colors: {
            ...DefaultColors,
            Primary: '#00F1F2',
            Secondary: '#00A9AA',
            Tertiary: '#A5D5D5',
            PrimaryBackground: '#1A3031',
            SecondaryBackground: '#234748',
            TertiaryBackground: '#245657',
            AppBackground: '#152323',
            TextInput: '#294A4A',
            ActiveText: '#FFFFFF',
            MainText: '#DDDDDD',
        },
    },
    {
        name: 'Blue Depths',
        colors: {
            ...DefaultColors,
            Primary: '#0000F2',
            Secondary: '#0000AA',
            Tertiary: '#A5A5D5',
            PrimaryBackground: '#1A1A31',
            SecondaryBackground: '#232348',
            TertiaryBackground: '#242457',
            AppBackground: '#151523',
            TextInput: '#29294A',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
];
