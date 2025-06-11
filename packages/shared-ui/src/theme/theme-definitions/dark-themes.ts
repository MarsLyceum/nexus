import { COLORS as DefaultColors } from '../../constants/colors';
import type { Theme } from '../themes';

export const DarkThemes: Theme[] = [
    {
        name: 'High Contrast Dark',
        colors: {
            ...DefaultColors,
            // Accent calls-to-action stand out strongly against layered blacks
            Primary: '#009999',
            Secondary: '#FFFFFF', // fallback to white for secondary elements
            Tertiary: '#666666', // mid-gray for tertiary indicators

            // Backgrounds now step up in very dark grays instead of all pure black
            AppBackground: '#000000',
            PrimaryBackground: '#0D0D0D',
            SecondaryBackground: '#1A1A1A',
            TertiaryBackground: '#262626',

            // Inputs sit on a very dark gray so borders/text remain visible
            TextInput: '#1A1A1A',

            // White for active/high-emphasis text
            ActiveText: '#FFFFFF',
            MainText: '#E0E0E0', // slightly toned-down white
            InactiveText: '#888888', // medium gray when disabled/low emphasis

            // Links and accents
            AccentText: '#FFCB00', // match Primary for links
            Link: '#FFCB00',
            Idle: '#FF5500',
            Success: '#28C76F',
            Error: '#EA5455',
        },
    },
    {
        name: 'Soft Gray Dark',
        colors: {
            ...DefaultColors,
            // Softer accent: pale teal for highlights
            Primary: '#448bc9', // pale teal
            Secondary: '#80DEEA', // lighter teal
            Tertiary: '#B2EBF2', // very light teal

            // Deep gray backgrounds
            PrimaryBackground: '#121212',
            SecondaryBackground: '#1E1E1E',
            TertiaryBackground: '#272727',
            AppBackground: '#0D0D0D',

            TextInput: '#1F1F1F', // dark gray input background

            // Off-white text
            ActiveText: '#FFFFFF',
            MainText: '#DDDDDD',
            InactiveText: '#777777',

            AccentText: '#4DD0E1',
            Link: '#4DD0E1',
            Idle: '#FFA726',
            Success: '#66BB6A',
            Error: '#EF5350',
        },
    },
    {
        name: 'OLED True Black',
        colors: {
            ...DefaultColors,
            // Minimal accent: desaturated blue-gray
            Primary: '#6c7b82',
            Secondary: '#9eaab0',
            Tertiary: '#adb4b8',

            // Use pure black for the shell, then very dark grays to separate layers
            AppBackground: '#000000',
            PrimaryBackground: '#050505',
            SecondaryBackground: '#1a1a1a',
            TertiaryBackground: '#262626',

            TextInput: '#121212', // nearly black input background

            // Text is gray to avoid overly stark contrast
            ActiveText: '#E0E0E0',
            MainText: '#B0B0B0',
            InactiveText: '#555555',

            AccentText: '#90A4AE',
            Link: '#90A4AE',
            Idle: '#FDD835',
            Success: '#66BB6A',
            Error: '#FF7043',
        },
    },
    {
        name: 'Night Blue Dark',
        colors: {
            ...DefaultColors,
            // Cool blue-green accents
            Primary: '#26C6DA',
            Secondary: '#00ACC1',
            Tertiary: '#00838F',

            // Very deep navy backgrounds
            PrimaryBackground: '#0A0F1A',
            SecondaryBackground: '#131E2E',
            TertiaryBackground: '#1C2D42',
            AppBackground: '#061222',

            TextInput: '#11202D',

            ActiveText: '#FFFFFF',
            MainText: '#E3E3E3',
            InactiveText: '#7A7A7A',

            AccentText: '#26C6DA',
            Link: '#26C6DA',
            Idle: '#FFEE58',
            Success: '#66BB6A',
            Error: '#EC407A',
        },
    },
    {
        name: 'Earthy Brown Dark',
        colors: {
            ...DefaultColors,
            // Muted amber/brown accent
            Primary: '#A1887F',
            Secondary: '#BCAAA4',
            Tertiary: '#D7CCC8',

            // Dark brown/charcoal backgrounds
            PrimaryBackground: '#1B130F',
            SecondaryBackground: '#2C1F1B',
            TertiaryBackground: '#3D2B27',
            AppBackground: '#100A07',

            TextInput: '#251D1A',

            ActiveText: '#F5F5F5',
            MainText: '#D8D8D8',
            InactiveText: '#7A7A7A',

            AccentText: '#D7CCC8',
            Link: '#D7CCC8',
            Idle: '#FFB300',
            Success: '#81C784',
            Error: '#E57373',
        },
    },
];
