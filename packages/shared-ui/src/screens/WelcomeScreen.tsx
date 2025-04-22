// shared-ui/screens/WelcomeScreen.tsx
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    Platform,
    Text,
} from 'react-native';
import React, { useEffect, useMemo } from 'react';

import { useNexusRouter } from '../hooks';
import { RootState, useAppSelector, useAppDispatch, loadUser } from '../redux';
import { PeepsLogo } from '../images/PeepsLogo';
import { PrimaryGradientButton, SecondaryButton } from '../buttons';
import { Footer } from '..';
import { useTheme, Theme } from '../theme';

const isWeb = Platform.OS === 'web';

function createStyles(theme: Theme) {
    return StyleSheet.create({
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
            backgroundColor: theme.colors.AppBackground,
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
        tagline: {
            fontFamily: 'Lato_700Bold',
            fontSize: 24,
            marginTop: 63,
            color: theme.colors.MainText,
        },
    });
}

export function WelcomeScreen(): JSX.Element {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: RootState) => state.user.user);
    const router = useNexusRouter();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            // If user is loaded, navigate to the matching screen
            router.push('/');
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
                    <Text>Where friends and communities thrive</Text>
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
