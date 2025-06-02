import { COLORS as DefaultColors } from '../../constants/colors';
import type { Theme } from '../themes';

export const NeonPulse: Theme[] = [
    {
        name: 'Electric Blue',
        colors: {
            ...DefaultColors,
            // Brighter, fully saturated electric/cyan accents
            Primary: '#00A8FF',
            Secondary: '#00FFFF',
            Tertiary: '#66FFFF',

            // Four distinct dark-teal layers
            AppBackground: '#000F0F', // RGB(0,15,15)
            PrimaryBackground: '#001A1A', // RGB(0,26,26)
            SecondaryBackground: '#003333', // RGB(0,51,51)
            TertiaryBackground: '#004C4C', // RGB(0,76,76)

            TextInput: '#003A3A', // dark teal for input fields

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Neon Pink',
        colors: {
            ...DefaultColors,
            // Hot magenta/neon pink accents
            Primary: '#FF00DB',
            Secondary: '#FF33FF',
            Tertiary: '#FF99FF',

            // Four purple-black layers
            AppBackground: '#0F000F', // RGB(15,0,15)
            PrimaryBackground: '#1F001F', // RGB(31,0,31)
            SecondaryBackground: '#3F003F', // RGB(63,0,63)
            TertiaryBackground: '#5F005F', // RGB(95,0,95)

            TextInput: '#3A003A',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Lime Shock',
        colors: {
            ...DefaultColors,
            // Bright lime/neon green accents
            Primary: '#a7d100',
            Secondary: '#E5FF33',
            Tertiary: '#F0FF66',

            // Four yellow-green layers
            AppBackground: '#0F0F00', // RGB(15,15,0)
            PrimaryBackground: '#1F1F00', // RGB(31,31,0)
            SecondaryBackground: '#3F3F00', // RGB(63,63,0)
            TertiaryBackground: '#5F5F00', // RGB(95,95,0)

            TextInput: '#3A3A00',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Vibrant Violet',
        colors: {
            ...DefaultColors,
            // Bright purple/neon violet accents
            Primary: '#9B00FF',
            Secondary: '#CC00FF',
            Tertiary: '#E066FF',

            // Reuse the same purple-black layering as “Neon Pink”
            AppBackground: '#0F000F', // RGB(15,0,15)
            PrimaryBackground: '#1F001F', // RGB(31,0,31)
            SecondaryBackground: '#3F003F', // RGB(63,0,63)
            TertiaryBackground: '#5F005F', // RGB(95,0,95)

            TextInput: '#3A003A',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Laser Green',
        colors: {
            ...DefaultColors,
            // Neon green accents
            Primary: '#39FF14',
            Secondary: '#7CFF00',
            Tertiary: '#BFFF66',

            // Four dark-green layers
            AppBackground: '#000F00', // RGB(0,15,0)
            PrimaryBackground: '#001F00', // RGB(0,31,0)
            SecondaryBackground: '#003F00', // RGB(0,63,0)
            TertiaryBackground: '#005F00', // RGB(0,95,0)

            TextInput: '#003A00',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Hot Coral',
        colors: {
            ...DefaultColors,
            // Neon coral/pink-red accents
            Primary: '#FF3F3F',
            Secondary: '#FF5F5F',
            Tertiary: '#FF8F8F',

            // Four dark-reddish layers
            AppBackground: '#0F0707', // RGB(15,7,7)
            PrimaryBackground: '#1F0E0E', // RGB(31,14,14)
            SecondaryBackground: '#3F1D1D', // RGB(63,29,29)
            TertiaryBackground: '#5F2C2C', // RGB(95,44,44)

            TextInput: '#3A1A1A',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Cyber Yellow',
        colors: {
            ...DefaultColors,
            // Bright neon yellow accents
            Primary: '#bfbf02',
            Secondary: '#FFFF33',
            Tertiary: '#FFFF66',

            // Four dark-yellow layers
            AppBackground: '#0F0E00', // RGB(15,14,0)
            PrimaryBackground: '#1F1E00', // RGB(31,30,0)
            SecondaryBackground: '#3F3C00', // RGB(63,60,0)
            TertiaryBackground: '#5F5A00', // RGB(95,90,0)

            TextInput: '#3A3300',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Fluorescent Red',
        colors: {
            ...DefaultColors,
            // Neon red/pinkish accents
            Primary: '#FF004F',
            Secondary: '#FF1F66',
            Tertiary: '#FF4F8F',

            // Four deep-red layers
            AppBackground: '#0F0005', // RGB(15,0,5)
            PrimaryBackground: '#1F000A', // RGB(31,0,10)
            SecondaryBackground: '#3F0014', // RGB(63,0,20)
            TertiaryBackground: '#5F001E', // RGB(95,0,30)

            TextInput: '#3A001F',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Ultra Aqua',
        colors: {
            ...DefaultColors,
            // Neon aqua/cyan accents
            Primary: '#00FFF7',
            Secondary: '#4FFFFF',
            Tertiary: '#80FFFF',

            // Four dark-teal-blue layers
            AppBackground: '#000F0C', // RGB(0,15,12)
            PrimaryBackground: '#001F19', // RGB(0,31,25)
            SecondaryBackground: '#003F33', // RGB(0,63,51)
            TertiaryBackground: '#005F4D', // RGB(0,95,77)

            TextInput: '#003A2F',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
    {
        name: 'Radical Magenta',
        colors: {
            ...DefaultColors,
            // Neon magenta/pink accents
            Primary: '#FF00C8',
            Secondary: '#FF4FD8',
            Tertiary: '#FF80E0',

            // Four dark-magenta layers
            AppBackground: '#0F000D', // RGB(15,0,13)
            PrimaryBackground: '#1F001B', // RGB(31,0,27)
            SecondaryBackground: '#3F0037', // RGB(63,0,55)
            TertiaryBackground: '#5F0053', // RGB(95,0,83)

            TextInput: '#3A0031',

            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0',
            InactiveText: '#989898',
        },
    },
];
