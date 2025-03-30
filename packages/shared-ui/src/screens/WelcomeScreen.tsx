// @shared-ui/screens/WelcomeScreen.tsx
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    Platform,
} from 'react-native';
import React, { useEffect } from 'react';
import styled from 'styled-components/native';

import { useNexusRouter } from '../hooks';
import { RootState, useAppSelector, useAppDispatch, loadUser } from '../redux';
import { PeepsLogo } from '../images/PeepsLogo';
import { PrimaryGradientButton, SecondaryButton } from '../buttons';
import { Footer } from '..';
import { COLORS } from '../constants';

const isWeb = Platform.OS === 'web';

const Tagline = styled.Text`
    font-family: Lato_700Bold;
    font-size: 24px;
    margin-top: 63px;
    color: ${COLORS.MainText};
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
        paddingVertical: 20,
        width: '100%',
    },
    outerContainer: {
        flex: 1,
        backgroundColor: COLORS.AppBackground,
        // For web, ensure the container fills the viewport.
        ...(isWeb && { position: 'relative', minHeight: '100vh' }),
    },
    innerScrollContainer: isWeb
        ? {
              // Remove absolute positioning for web to allow natural flow
              flexGrow: 1,
          }
        : {
              width: '100%',
              flexGrow: 1,
          },
    footerContainer: {
        flexShrink: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export function WelcomeScreen(): JSX.Element {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: RootState) => state.user.user);
    const router = useNexusRouter();

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            // If user is loaded, navigate to the matching screen
            router.push('/dashboard');
        }
    }, [user, router]);

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
                        onPress={() => router.push('/signup')}
                    />
                    <SecondaryButton
                        style={styles.bottomButton}
                        title="Log in"
                        onPress={() => router.push('/login')}
                    />
                </View>
                <View style={styles.footerContainer}>
                    <Footer />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
