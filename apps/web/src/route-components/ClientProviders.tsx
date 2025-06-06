'use client';

import '../../polyfills/expo-polyfills.js';

import React, { useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, Platform } from 'react-native';
import { ApolloProvider } from '@apollo/client';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { Provider as ReduxProvider } from 'react-redux';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { store } from 'shared-ui/redux';
import {
    ActiveGroupProvider,
    SearchProvider,
    CurrentCommentProvider,
    PortalProvider,
} from 'shared-ui/providers';
import { StatusManager, Login } from 'shared-ui/small-components';
import { createApolloClient } from 'shared-ui/utils';
import { useTheme, ThemeProvider } from 'shared-ui/theme';
import { useFonts } from 'expo-font';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import {
    Roboto_400Regular,
    Roboto_400Regular_Italic,
    Roboto_500Medium,
    Roboto_500Medium_Italic,
    Roboto_700Bold,
    Roboto_700Bold_Italic,
} from '@expo-google-fonts/roboto';

// Create your Apollo client.
const client = createApolloClient();

const CustomScrollbar = () => {
    const { theme } = useTheme();
    if (Platform.OS !== 'web') return undefined;
    return (
        <style>{`
            /* Chrome, Safari and Opera */
            ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            ::-webkit-scrollbar-track {
                background: ${theme.colors.PrimaryBackground};
            }
            ::-webkit-scrollbar-thumb {
                background-color: ${theme.colors.TextInput};
                border-radius: 999px;
            }
            /* Firefox */
            * {
                scrollbar-width: thin;
                scrollbar-color: ${theme.colors.TextInput} ${theme.colors.PrimaryBackground};
            }
        `}</style>
    );
};

const ClientProvidersContent = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const { theme } = useTheme();
    return (
        <ActiveGroupProvider>
            <SearchProvider>
                <CurrentCommentProvider>
                    <SafeAreaProvider
                        initialMetrics={{
                            insets: { top: 0, left: 0, bottom: 0, right: 0 },
                            frame: { x: 0, y: 0, width: 375, height: 812 },
                        }}
                    >
                        <StatusBar
                            barStyle="light-content"
                            backgroundColor={theme.colors.AppBackground}
                        />
                        <SafeAreaView
                            style={{
                                flex: 1,
                                backgroundColor: theme.colors.AppBackground,
                            }}
                            edges={['top', 'left', 'right', 'bottom']}
                        >
                            <CustomScrollbar />
                            <ApolloProvider client={client}>
                                <ReduxProvider store={store}>
                                    <PortalProvider>
                                        <GestureHandlerRootView
                                            style={{ flex: 1 }}
                                        >
                                            <StatusManager>
                                                <Login>{children}</Login>
                                                <Toast />
                                            </StatusManager>
                                        </GestureHandlerRootView>
                                    </PortalProvider>
                                </ReduxProvider>
                            </ApolloProvider>
                        </SafeAreaView>
                    </SafeAreaProvider>
                </CurrentCommentProvider>
            </SearchProvider>
        </ActiveGroupProvider>
    );
};

export function ClientProviders({ children }: { children: React.ReactNode }) {
    // Only load fonts on the client.
    const [fontsLoaded] = useFonts({
        Lato_400Regular,
        Lato_700Bold,
        Roboto_400Regular,
        Roboto_400Regular_Italic,
        Roboto_500Medium,
        Roboto_500Medium_Italic,
        Roboto_700Bold,
        Roboto_700Bold_Italic,
    });

    useEffect(() => {
        if (fontsLoaded) {
            void SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    return (
        <ThemeProvider>
            <ClientProvidersContent>{children}</ClientProvidersContent>
        </ThemeProvider>
    );
}
