/* eslint-disable max-lines */
// src/theme/dual-tone.ts
import { COLORS as DefaultColors } from '../../constants/colors';
import type { Theme } from '../themes';

export const DualTone: Theme[] = [
    {
        name: 'Dusk & Dawn',
        colors: {
            ...DefaultColors,
            Primary: '#CC5833', // darker mid-tone of #FF6E40
            Secondary: '#FF6E40',
            Tertiary: '#304FFE',
            PrimaryBackground: '#8F3E24', // 30% darker than #CC5833
            SecondaryBackground: '#2237B2', // 30% darker than #304FFE
            TertiaryBackground: '#B24D2D', // 30% darker than #FF6E40
            AppBackground: '#13121F',
            TextInput: '#2A2940',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Crimson & Navy',
        colors: {
            ...DefaultColors,
            Primary: '#B21235', // darker mid-tone of #DC143C
            Secondary: '#DC143C',
            Tertiary: '#000080',
            PrimaryBackground: '#7D0D25', // 30% darker than #B21235
            SecondaryBackground: '#00005A', // 30% darker than #000080
            TertiaryBackground: '#9A0E2A', // 30% darker than #DC143C
            AppBackground: '#120A12',
            TextInput: '#2E1F2E',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Emerald & Gold',
        colors: {
            ...DefaultColors,
            Primary: '#3FA25F', // darker mid-tone of #50C878
            Secondary: '#50C878',
            Tertiary: '#FFD700',
            PrimaryBackground: '#2C7142', // 30% darker than #3FA25F
            SecondaryBackground: '#B29600', // 30% darker than #FFD700
            TertiaryBackground: '#388C54', // 30% darker than #50C878
            AppBackground: '#10170E',
            TextInput: '#28342B',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Coral & Teal',
        colors: {
            ...DefaultColors,
            Primary: '#E6734D', // darker mid-tone of #FF7F50
            Secondary: '#FF7F50',
            Tertiary: '#008080',
            PrimaryBackground: '#A15036', // 30% darker than #E6734D
            SecondaryBackground: '#005A5A', // 30% darker than #008080
            TertiaryBackground: '#B25938', // 30% darker than #FF7F50
            AppBackground: '#141312',
            TextInput: '#2E2C29',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Lavender & Plum',
        colors: {
            ...DefaultColors,
            Primary: '#9260B1', // darker mid-tone of #B57EDC
            Secondary: '#B57EDC',
            Tertiary: '#8E4585',
            PrimaryBackground: '#66437C', // 30% darker than #9260B1
            SecondaryBackground: '#63305D', // 30% darker than #8E4585
            TertiaryBackground: '#7F589A', // 30% darker than #B57EDC
            AppBackground: '#140E17',
            TextInput: '#2F2434',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Blueberry & Mint',
        colors: {
            ...DefaultColors,
            Primary: '#3F6ED1', // darker mid-tone of #4F86F7
            Secondary: '#4F86F7',
            Tertiary: '#AAF0D1',
            PrimaryBackground: '#2C4D92', // 30% darker than #3F6ED1
            SecondaryBackground: '#77A892', // 30% darker than #AAF0D1
            TertiaryBackground: '#375EAD', // 30% darker than #4F86F7
            AppBackground: '#10151A',
            TextInput: '#2B3741',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Rust & Olive',
        colors: {
            ...DefaultColors,
            Primary: '#99330D', // darker mid-tone of #B7410E
            Secondary: '#B7410E',
            Tertiary: '#808000',
            PrimaryBackground: '#6B2409', // 30% darker than #99330D
            SecondaryBackground: '#5A5A00', // 30% darker than #808000
            TertiaryBackground: '#5A5A00', // 30% darker than #808000
            AppBackground: '#17140F',
            TextInput: '#2F2B27',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Peach & Charcoal',
        colors: {
            ...DefaultColors,
            Primary: '#E6B999', // darker mid-tone of #FFDAB9
            Secondary: '#FFDAB9',
            Tertiary: '#36454F',
            PrimaryBackground: '#A1826B', // 30% darker than #E6B999
            SecondaryBackground: '#263037', // 30% darker than #36454F
            TertiaryBackground: '#B29982', // 30% darker than #FFDAB9
            AppBackground: '#141416',
            TextInput: '#2E2F30',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Magenta & Lime',
        colors: {
            ...DefaultColors,
            Primary: '#CC00CC', // darker mid-tone of #FF00FF
            Secondary: '#FF00FF',
            Tertiary: '#32CD32',
            PrimaryBackground: '#8F008F', // 30% darker than #CC00CC
            SecondaryBackground: '#239023', // 30% darker than #32CD32
            TertiaryBackground: '#B200B2', // 30% darker than #FF00FF
            AppBackground: '#160E16',
            TextInput: '#2F262F',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Mustard & Indigo',
        colors: {
            ...DefaultColors,
            Primary: '#D4B148', // darker mid-tone of #FFDB58
            Secondary: '#FFDB58',
            Tertiary: '#4B0082',
            PrimaryBackground: '#947C32', // 30% darker than #D4B148
            SecondaryBackground: '#34005B', // 30% darker than #4B0082
            TertiaryBackground: '#B2993E', // 30% darker than #FFDB58
            AppBackground: '#131016',
            TextInput: '#2D272D',
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
];
