import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    View,
    ImageSourcePropType,
    Text,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { COLORS } from '../constants';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonContainer: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8, // Keeps edges rounded
        overflow: 'hidden', // Prevents image overflow outside button
    },
    image: {
        width: '100%', // Fills the full button
        height: '100%',
    },
    text: {
        marginLeft: 8, // Spacing between the button and the text
        fontSize: 14,
        color: COLORS.White,
        fontFamily: 'Roboto_500Medium',
        fontWeight: 'semibold',
    },
});

export const GroupButton = ({
    onPress,
    imageSource,
    groupName,
}: {
    onPress: () => unknown;
    imageSource: ImageSourcePropType;
    groupName: string;
}) => (
    <TouchableOpacity style={styles.container} onPress={onPress}>
        <View style={styles.buttonContainer}>
            <View style={styles.button}>
                <ExpoImage
                    source={imageSource}
                    style={styles.image}
                    contentFit="cover" // Ensures the image fills the entire rectangle
                />
            </View>
        </View>
        <Text style={styles.text}>{groupName}</Text>
    </TouchableOpacity>
);
