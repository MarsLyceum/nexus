import React, { useState, useEffect, useMemo } from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image } from 'react-native';

import { useTheme, Theme } from '../theme';
import { NexusImage } from '../small-components/NexusImage';

export const GroupButton = ({
    onPress,
    imageSource,
    groupName,
}: {
    onPress: () => unknown;
    imageSource: string;
    groupName: string;
}) => {
    const [validAvatar, setValidAvatar] = useState<boolean>(false);
    const { theme } = useTheme();
    const styles = useMemo(() => createGroupButtonStyles(theme), [theme]);

    // Check if the avatar URL is valid before rendering.
    useEffect(() => {
        if (imageSource) {
            Image.getSize(
                imageSource,
                () => {
                    setValidAvatar(true);
                },
                (error) => {
                    console.warn(
                        'Avatar image failed to load, skipping expired image:',
                        error
                    );
                    setValidAvatar(false);
                }
            );
        } else {
            setValidAvatar(false);
        }
    }, [imageSource]);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.buttonContainer}>
                <View style={styles.button}>
                    {validAvatar && (
                        <NexusImage
                            source={imageSource}
                            width={45}
                            height={45}
                            contentFit="cover" // Ensures the image fills the entire rectangle
                            style={styles.image}
                            alt="Group Image"
                            onError={() => {
                                setValidAvatar(false);
                            }}
                        />
                    )}
                </View>
            </View>
            <Text style={styles.text}>{groupName}</Text>
        </TouchableOpacity>
    );
};

function createGroupButtonStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        buttonContainer: {
            width: 45,
            height: 45,
            alignItems: 'center',
            justifyContent: 'center',
        },
        button: {
            width: 45,
            height: 45,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10, // Keeps edges rounded
            overflow: 'hidden', // Prevents image overflow outside button
        },
        image: {
            width: '100%', // Fills the full button
            height: '100%',
        },
        text: {
            marginLeft: 8, // Spacing between the button and the text
            fontSize: 16,
            color: theme.colors.ActiveText,
            fontFamily: 'Roboto_500Medium',
            fontWeight: 'semibold',
        },
    });
}
