import React, { useMemo } from 'react';
import { View, TouchableWithoutFeedback, StyleSheet } from 'react-native';

import { Portal } from '../providers';
import { useTheme, Theme } from '../theme';
import { toRgba } from '../utils';
import { BorderRadius, Spacing, Opacity } from '../constants/designSystem';

export type CustomPortalModalProps = {
    visible: boolean;
    onClose: () => void;
    children: React.ReactNode;
    containerStyle?: object;
};

export const CustomPortalModal: React.FC<CustomPortalModalProps> = ({
    visible,
    onClose,
    children,
    containerStyle,
}) => {
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (!visible) return undefined;
    return (
        <Portal>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.portalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.portalContainer, containerStyle]}>
                            {children}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Portal>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        portalOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 9999,
            justifyContent: 'center',
            alignItems: 'center',
        },
        portalContainer: {
            width: '85%',
            maxWidth: 640,
            maxHeight: '90%',
            backgroundColor: theme.colors.SecondaryBackground,
            borderRadius: BorderRadius.Large,
            padding: Spacing.XXXL,
            zIndex: 10_000,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.Border),
            shadowColor: theme.colors.Primary,
            shadowOpacity: 0.35,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 18 },
            elevation: 20,
        },
    });
}
