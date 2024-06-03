import React from 'react';
import {
    StyleSheet,
    Image,
    SafeAreaView,
    ImageSourcePropType,
} from 'react-native';
import womanImg from './images/free-photo-of-woman-in-dress-lying-down-with-mirror-on-tree.jpeg';

export function MatchingScreen() {
    return (
        <SafeAreaView>
            <Image source={womanImg as ImageSourcePropType} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
