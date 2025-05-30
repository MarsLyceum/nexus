// src/theme/monochrome.ts
import { COLORS as DefaultColors } from '../../constants/colors';
import type { Theme } from '../themes';

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
            Primary: '#FF1A1A',
            Secondary: '#D10000',
            Tertiary: '#FFA6A6',
            PrimaryBackground: '#200000',
            SecondaryBackground: '#3B0000',
            TertiaryBackground: '#560000',
            AppBackground: '#110000',
            TextInput: '#4A1212',
            ActiveText: '#FFFFFF',
            MainText: '#F0F0F0',
            InactiveText: '#989898', // Updated: Neutral grey
        },
    },
    {
        name: 'Orange Ember',
        colors: {
            ...DefaultColors,
            Primary: '#FF8800',
            Secondary: '#CC6600',
            Tertiary: '#FFC28C',
            PrimaryBackground: '#331A00',
            SecondaryBackground: '#552B00',
            TertiaryBackground: '#773D00',
            AppBackground: '#261300',
            TextInput: '#663300',
            ActiveText: '#FFFFFF',
            MainText: '#EFEFEF',
            InactiveText: '#989898', // Updated: Neutral grey
        },
    },
    {
        name: 'Yellow Glow',
        colors: {
            ...DefaultColors,
            Primary: '#FFEE33',
            Secondary: '#E6C800',
            Tertiary: '#FFF5B2',
            PrimaryBackground: '#6b5d01',
            SecondaryBackground: '#968102',
            TertiaryBackground: '#c2aa02',
            AppBackground: '#332C00',
            TextInput: '#665800',
            ActiveText: '#000000',
            MainText: '#222222',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Green Meadow',
        colors: {
            ...DefaultColors,
            Primary: '#00CC00',
            Secondary: '#008800',
            Tertiary: '#A6D9A6',
            PrimaryBackground: '#102410',
            SecondaryBackground: '#204020',
            TertiaryBackground: '#305830',
            AppBackground: '#081208',
            TextInput: '#284628',
            ActiveText: '#FFFFFF',
            MainText: '#DDFFDD',
            InactiveText: '#989898', // Updated: Neutral grey
        },
    },
    {
        name: 'Cyan Tide',
        colors: {
            ...DefaultColors,
            Primary: '#00D1D1',
            Secondary: '#008080',
            Tertiary: '#B2E5E5',
            PrimaryBackground: '#102829',
            SecondaryBackground: '#1F3F40',
            TertiaryBackground: '#2E5657',
            AppBackground: '#071213',
            TextInput: '#265455',
            ActiveText: '#FFFFFF',
            MainText: '#E0FFFF',
            InactiveText: '#989898', // Updated: Neutral grey
        },
    },
    {
        name: 'Blue Depths',
        colors: {
            ...DefaultColors,
            Primary: '#0055FF',
            Secondary: '#0033AA',
            Tertiary: '#A6B8E5',
            PrimaryBackground: '#0D0D33',
            SecondaryBackground: '#1C1C4D',
            TertiaryBackground: '#2B2B66',
            AppBackground: '#080826',
            TextInput: '#24244D',
            ActiveText: '#FFFFFF',
            MainText: '#DEE8FF',
            InactiveText: '#989898', // Updated: Neutral grey
        },
    },
];
