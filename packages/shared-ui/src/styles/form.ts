import { StyleSheet } from 'react-native';

import type { Theme } from '../theme';
import { toRgba } from '../utils';
import {
    BorderRadius,
    Spacing,
    Typography,
    Opacity,
} from '../constants/designSystem';

export const createFormStyles = (theme: Theme) =>
    StyleSheet.create({
        outerContainer: {
            flex: 1,
            backgroundColor: theme.colors.AppBackground,
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: Spacing.XL,
        },
        slickWrapper: {},
        buttonContainerSmall: {
            display: 'flex',
            marginTop: Spacing.XS,
            marginBottom: Spacing.XS,
        },
        textInputContainer: {
            borderWidth: 1,
            borderRadius: BorderRadius.Medium,
            padding: Spacing.LG,
            backgroundColor: theme.colors.TextInput,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
            width: '100%',
        },
        fullWidth: {
            width: '100%',
        },
        inlineView: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        btnContainer: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'stretch',
            alignSelf: 'stretch',
            borderRadius: BorderRadius.Pill,
        },
        btnClickContain: {
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: BorderRadius.Medium,
            padding: Spacing.MD,
            marginTop: Spacing.XS,
            marginBottom: Spacing.XS,
            minHeight: 40,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.Border),
        },
        headerTitle: {
            fontSize: 24,
            fontWeight: '600',
            color: theme.colors.ActiveText,
        },
        wordCloudContainer: {
            borderWidth: 1,
            borderRadius: BorderRadius.Medium,
            padding: Spacing.LG,
            backgroundColor: theme.colors.TextInput,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
            width: '100%',
            minHeight: 60,
        },
        imageSelector: {
            width: '100%',
        },
        selectedImage: {
            width: '50%',
        },
        buttonContainer: {
            width: '75%',
            marginHorizontal: 'auto',
            marginTop: Spacing.XL,
        },
    });

export const formStyles = createFormStyles({
    colors: {
        AppBackground: '#1F1524',
        TextInput: '#3A2A4A',
        SecondaryBackground: '#382348',
        ActiveText: '#FFFFFF',
        Primary: '#7b49ff',
        Secondary: '#6F00AA',
        Tertiary: '#A6CFD5',
        PrimaryBackground: '#281B31',
        TertiaryBackground: '#412457',
        InactiveText: '#989898',
        MainText: '#C5C5C5',
        AccentText: '#b3a3ec',
        Link: '#3254a8',
        Idle: '#FAA61A',
        Success: '#31E143',
        Error: '#bb1817',
    },
    name: 'default',
});
