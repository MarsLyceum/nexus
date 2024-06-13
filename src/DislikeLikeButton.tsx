import React, { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { PeepsButton } from './PeepsButton';

const styles = StyleSheet.create({
    likeDislikeCircle: {
        width: 78,
        height: 78,
        borderRadius: 39,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',

        shadowColor: 'rgba(0, 0, 0, 0.4)',
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 4,
        elevation: 4,
    },
    buttonHovered: {
        backgroundColor: '#f0f0f0',
    },
});

export type DislikeLikeButtonProps = {
    children?: ReactNode;
    onPress: () => void;
};

export function DislikeLikeButton({
    children,
    onPress,
}: Readonly<DislikeLikeButtonProps>) {
    return (
        <PeepsButton onPress={onPress} style={styles.likeDislikeCircle}>
            {children}
        </PeepsButton>
    );
}
