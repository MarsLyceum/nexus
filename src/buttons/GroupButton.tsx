import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    Image,
    View,
    ImageSourcePropType,
} from 'react-native';

const styles = StyleSheet.create({
    buttonContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8, // Keeps edges rounded
        overflow: 'hidden', // Prevents image overflow outside button
    },
    image: {
        width: '100%', // Fills the full button
        height: '100%',
    },
});

export const GroupButton = ({
    onPress,
    imageSource,
}: {
    onPress: () => unknown;
    imageSource: ImageSourcePropType;
}) => (
    <TouchableOpacity onPress={onPress} style={styles.buttonContainer}>
        <View style={styles.button}>
            <Image
                source={imageSource}
                style={styles.image}
                resizeMode="cover" // Ensures the image fills the entire rectangle
            />
        </View>
    </TouchableOpacity>
);
