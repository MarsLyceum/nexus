import React, { useMemo } from 'react';
import { View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Portal } from '../providers';
import { useTheme, Theme } from '../theme';

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
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            justifyContent: 'center',
            alignItems: 'center',
        },
        portalContainer: {
            width: '85%',
            maxHeight: '100%', // Added maxHeight to restrict container height
            backgroundColor: theme.colors.AppBackground,
            borderRadius: 8,
            padding: 20,
            zIndex: 10_000,
        },
    });
}
