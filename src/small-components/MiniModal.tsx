import React from 'react';
import { View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Portal } from 'react-native-paper';
import { COLORS } from '../constants';

export type MiniModalProps = {
    visible: boolean;
    onClose: () => void;
    containerStyle?: object;
    children: React.ReactNode;
};

export const MiniModal: React.FC<MiniModalProps> = ({
    visible,
    onClose,
    containerStyle,
    children,
}) => {
    if (!visible) return undefined;
    return (
        <Portal>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlayWrapper}>
                    <TouchableWithoutFeedback>
                        <View
                            style={[styles.miniModalContainer, containerStyle]}
                        >
                            {children}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Portal>
    );
};

const styles = StyleSheet.create({
    overlayWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
    },
    miniModalContainer: {
        position: 'absolute',
        left: '50%',
        bottom: 70, // default positioning for emoji modal (anchored above the input box)
        width: 350,
        maxHeight: 250,
        backgroundColor: COLORS.PrimaryBackground,
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        transform: [{ translateX: -175 }],
    },
});
