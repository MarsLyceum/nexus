// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable max-lines */
// src/theme/dual-tone.ts
import { COLORS as DefaultColors } from '../constants/colors';
import type { Theme } from './themes';

export const DualTone: Theme[] = [
    {
        name: 'Dusk & Dawn',
        colors: {
            ...DefaultColors,
            Primary: '#CC5833', // darker mid-tone of #FF6E40
            Secondary: '#FF6E40',
            Tertiary: '#304FFE',
            PrimaryBackground: '#1B1A2E',
            SecondaryBackground: '#27263D',
            TertiaryBackground: '#323150',
            AppBackground: '#13121F',
            TextInput: '#2A2940',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Crimson & Navy',
        colors: {
            ...DefaultColors,
            Primary: '#B21235', // darker mid-tone of #DC143C
            Secondary: '#DC143C',
            Tertiary: '#000080',
            PrimaryBackground: '#1F121C',
            SecondaryBackground: '#2A1C29',
            TertiaryBackground: '#351635',
            AppBackground: '#120A12',
            TextInput: '#2E1F2E',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Emerald & Gold',
        colors: {
            ...DefaultColors,
            Primary: '#3FA25F', // darker mid-tone of #50C878
            Secondary: '#50C878',
            Tertiary: '#FFD700',
            PrimaryBackground: '#1A2416',
            SecondaryBackground: '#273322',
            TertiaryBackground: '#34432E',
            AppBackground: '#10170E',
            TextInput: '#28342B',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Coral & Teal',
        colors: {
            ...DefaultColors,
            Primary: '#E6734D', // darker mid-tone of #FF7F50
            Secondary: '#FF7F50',
            Tertiary: '#008080',
            PrimaryBackground: '#1F1D1B',
            SecondaryBackground: '#2A2825',
            TertiaryBackground: '#353330',
            AppBackground: '#141312',
            TextInput: '#2E2C29',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Lavender & Plum',
        colors: {
            ...DefaultColors,
            Primary: '#9260B1', // darker mid-tone of #B57EDC
            Secondary: '#B57EDC',
            Tertiary: '#8E4585',
            PrimaryBackground: '#1D1622',
            SecondaryBackground: '#29212F',
            TertiaryBackground: '#352C3D',
            AppBackground: '#140E17',
            TextInput: '#2F2434',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Blueberry & Mint',
        colors: {
            ...DefaultColors,
            Primary: '#3F6ED1', // darker mid-tone of #4F86F7
            Secondary: '#4F86F7',
            Tertiary: '#AAF0D1',
            PrimaryBackground: '#1A2023',
            SecondaryBackground: '#253039',
            TertiaryBackground: '#30414F',
            AppBackground: '#10151A',
            TextInput: '#2B3741',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Rust & Olive',
        colors: {
            ...DefaultColors,
            Primary: '#99330D', // darker mid-tone of #B7410E
            Secondary: '#B7410E',
            Tertiary: '#808000',
            PrimaryBackground: '#231F1A',
            SecondaryBackground: '#2E2923',
            TertiaryBackground: '#3A352D',
            AppBackground: '#17140F',
            TextInput: '#2F2B27',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Peach & Charcoal',
        colors: {
            ...DefaultColors,
            Primary: '#E6B999', // darker mid-tone of #FFDAB9
            Secondary: '#FFDAB9',
            Tertiary: '#36454F',
            PrimaryBackground: '#1F1F20',
            SecondaryBackground: '#2A2A2B',
            TertiaryBackground: '#353537',
            AppBackground: '#141416',
            TextInput: '#2E2F30',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Magenta & Lime',
        colors: {
            ...DefaultColors,
            Primary: '#CC00CC', // darker mid-tone of #FF00FF
            Secondary: '#FF00FF',
            Tertiary: '#32CD32',
            PrimaryBackground: '#201B20',
            SecondaryBackground: '#2B252B',
            TertiaryBackground: '#362E36',
            AppBackground: '#160E16',
            TextInput: '#2F262F',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
    {
        name: 'Mustard & Indigo',
        colors: {
            ...DefaultColors,
            Primary: '#D4B148', // darker mid-tone of #FFDB58
            Secondary: '#FFDB58',
            Tertiary: '#4B0082',
            PrimaryBackground: '#1E1B1F',
            SecondaryBackground: '#292429',
            TertiaryBackground: '#342E34',
            AppBackground: '#131016',
            TextInput: '#2D272D',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
        },
    },
];
