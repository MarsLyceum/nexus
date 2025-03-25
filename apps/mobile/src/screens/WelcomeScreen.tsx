import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    Platform,
} from 'react-native';
import React, { useEffect } from 'react';
import { NavigationProp, useFocusEffect } from '@react-navigation/core';
import styled from 'styled-components/native';

import {
    RootState,
    useAppSelector,
    useAppDispatch,
    loadUser,
} from '@shared-ui/redux';
import { PeepsLogo } from '@shared-ui/images/PeepsLogo';
import { PrimaryGradientButton, SecondaryButton } from '@shared-ui/buttons';
import { Footer } from '@shared-ui';
import { COLORS } from '@shared-ui/constants';

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
        backgroundColor: COLORS.AppBackground, // changed from '#fff'
    },
    innerScrollContainer: isWeb
        ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
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

export function WelcomeScreen({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state: RootState) => state.user.user);

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    useFocusEffect(() => {
        if (user) {
            // If user is loaded, navigate to the matching screen
            navigation.navigate('AppDrawer');
        }
    });

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
                        onPress={() => navigation.navigate('SignUp')}
                    />
                    <SecondaryButton
                        style={styles.bottomButton}
                        title="Log in"
                        onPress={() => navigation.navigate('Login')}
                    />
                </View>
                <View style={styles.footerContainer}>
                    <Footer />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
