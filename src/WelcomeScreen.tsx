import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import React from 'react';
import { NavigationProp } from '@react-navigation/core';
import styled from 'styled-components/native';
import { PeepsLogo } from './images/PeepsLogo';
import { PrimaryGradientButton } from './PrimaryGradientButton';
import { SecondaryButton } from './SecondaryButton';
import { Footer } from './Footer';

const Tagline = styled.Text`
    font-family: Lato_700Bold;
    font-size: 24px;
    margin-top: 63px;
`;

const styles = StyleSheet.create({
    topButton: {
        marginTop: 63,
    },
    bottomButton: {
        marginTop: 48,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outerContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    innerScrollContainer: {
        width: '100%',
        paddingBottom: 48, // Adds space for footer
    },
});

export function WelcomeScreen({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) {
    return (
        <SafeAreaView style={styles.outerContainer}>
            <ScrollView
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.innerScrollContainer}
            >
                <View style={styles.centeredContainer}>
                    <PeepsLogo />
                    <Tagline>Where friends and communities thrive</Tagline>
                    <PrimaryGradientButton
                        style={styles.topButton}
                        title="Create an account"
                        onPress={() => {}}
                    />
                    <SecondaryButton
                        style={styles.bottomButton}
                        title="Log in"
                        onPress={() => {}}
                    />
                </View>
                <Footer />
            </ScrollView>
        </SafeAreaView>
    );
}
