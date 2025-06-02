import { COLORS as DefaultColors } from '../../constants/colors';
import type { Theme } from '../themes';

export const LightThemes: Theme[] = [
    {
        name: 'High Contrast Light',
        colors: {
            ...DefaultColors,
            // Strong accent (dark teal) against white
            Primary: '#005555',
            Secondary: '#333333',
            Tertiary: '#777777',

            // Backgrounds now have larger steps between each layer
            AppBackground: '#FFFFFF',
            PrimaryBackground: '#F0F0F0',
            SecondaryBackground: '#DDDDDD',
            TertiaryBackground: '#CCCCCC',

            // Inputs on a very light gray so borders/text remain visible
            TextInput: '#F0F0F0',

            // Dark text for high legibility on white
            ActiveText: '#000000',
            MainText: '#212121',
            InactiveText: '#888888',

            // Links and accents match Primary
            AccentText: '#005555',
            Link: '#005555',
            Idle: '#FF9900',
            Success: '#28A745',
            Error: '#DC3545',
        },
    },
    {
        name: 'Soft Gray Light',
        colors: {
            ...DefaultColors,
            // Soft blue accent
            Primary: '#448BC9',
            Secondary: '#6FAFEA',
            Tertiary: '#A3D4F7',

            // Gentle gray backgrounds with more contrast
            AppBackground: '#FFFFFF',
            PrimaryBackground: '#F5F5F5',
            SecondaryBackground: '#E5E5E5',
            TertiaryBackground: '#D5D5D5',

            TextInput: '#F0F0F0',

            // Off-black text so it isn’t too harsh
            ActiveText: '#111111',
            MainText: '#333333',
            InactiveText: '#777777',

            AccentText: '#448BC9',
            Link: '#448BC9',
            Idle: '#FFB74D',
            Success: '#66BB6A',
            Error: '#E57373',
        },
    },
    {
        name: 'Pure White Light',
        colors: {
            ...DefaultColors,
            // Desaturated blue-gray accent
            Primary: '#607D8B',
            Secondary: '#78909C',
            Tertiary: '#90A4AE',

            // Mostly white, then three more obvious gray layers
            AppBackground: '#FFFFFF',
            PrimaryBackground: '#F8F8F8',
            SecondaryBackground: '#EEEEEE',
            TertiaryBackground: '#E0E0E0',

            TextInput: '#F5F5F5',

            // Dark charcoal text on white
            ActiveText: '#212121',
            MainText: '#424242',
            InactiveText: '#757575',

            AccentText: '#607D8B',
            Link: '#607D8B',
            Idle: '#FFC107',
            Success: '#4CAF50',
            Error: '#F44336',
        },
    },
    {
        name: 'Sky Blue Light',
        colors: {
            ...DefaultColors,
            // Medium-dark blue accent
            Primary: '#1976D2',
            Secondary: '#2196F3',
            Tertiary: '#64B5F6',

            // Very pale blues for backgrounds
            AppBackground: '#E3F2FD',
            PrimaryBackground: '#BBDEFB',
            SecondaryBackground: '#90CAF9',
            TertiaryBackground: '#64B5F6',

            TextInput: '#E1F5FE',

            // Dark gray text for contrast over light blue
            ActiveText: '#0D47A1',
            MainText: '#1565C0',
            InactiveText: '#5C6BC0',

            AccentText: '#1976D2',
            Link: '#1976D2',
            Idle: '#FFEB3B',
            Success: '#4CAF50',
            Error: '#E91E63',
        },
    },
    {
        name: 'Earthy Sand Light',
        colors: {
            ...DefaultColors,
            // Muted brown accent
            Primary: '#8D6E63',
            Secondary: '#A1887F',
            Tertiary: '#D7CCC8',

            // Creams and light tans for backgrounds
            AppBackground: '#FFF8E1',
            PrimaryBackground: '#FFECB3',
            SecondaryBackground: '#FFE082',
            TertiaryBackground: '#FFD54F',

            TextInput: '#FFF3E0',

            // Dark brown text for strong contrast
            ActiveText: '#3E2723',
            MainText: '#5D4037',
            InactiveText: '#9E9E9E',

            AccentText: '#8D6E63',
            Link: '#8D6E63',
            Idle: '#FFC107',
            Success: '#8BC34A',
            Error: '#E64A19',
        },
    },
];
