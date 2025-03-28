// apps/web/pages/_app.tsx

import '../../polyfills/expo-polyfills.js';

import 'react-native-get-random-values';
import React, { useEffect } from 'react';

import { AppProps } from 'next/app';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import { ApolloProvider } from '@apollo/client';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { Provider as PortalProvider } from 'react-native-paper';
import { Provider as ReduxProvider } from 'react-redux';

import { store } from '@shared-ui/redux';
import {
    ActiveGroupProvider,
    SearchProvider,
    CurrentCommentProvider,
} from '@shared-ui/providers';
import { StatusManager } from '@shared-ui/small-components';
import { COLORS } from '@shared-ui/constants';
import { createApolloClient } from '@shared-ui/utils';

import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import {
    Roboto_400Regular,
    Roboto_400Regular_Italic,
    Roboto_500Medium,
    Roboto_500Medium_Italic,
    Roboto_700Bold,
    Roboto_700Bold_Italic,
} from '@expo-google-fonts/roboto';
import { useFonts } from 'expo-font';

// CustomScrollbar injects CSS for web only.
const CustomScrollbar = () => {
    if (Platform.OS !== 'web') return null;
    return (
        <style>{`
            /* Chrome, Safari and Opera */
            ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            ::-webkit-scrollbar-track {
                background: ${COLORS.PrimaryBackground};
            }
            ::-webkit-scrollbar-thumb {
                background-color: ${COLORS.TextInput};
                border-radius: 999px;
            }
            /* Firefox */
            * {
                scrollbar-width: thin;
                scrollbar-color: ${COLORS.TextInput} ${COLORS.PrimaryBackground};
            }
        `}</style>
    );
};

const client = createApolloClient();

// Determine if we're on the server.
const isServer = typeof window === 'undefined';

export default function App({ Component, pageProps }: AppProps): JSX.Element {
    // Use fonts only on the client.
    // Even if fonts are not yet loaded, we don't render a fallback that differs from the server.
    const [fontsLoaded] = !isServer
        ? // we are technically not violating the rules of hooks because
          // isServer never changes when the file is running
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useFonts({
              Lato_400Regular,
              Lato_700Bold,
              Roboto_400Regular,
              Roboto_400Regular_Italic,
              Roboto_500Medium,
              Roboto_500Medium_Italic,
              Roboto_700Bold,
              Roboto_700Bold_Italic,
          })
        : [true];

    // On the client, hide splash screen when fonts are loaded.
    useEffect(() => {
        if (!isServer && fontsLoaded) {
            SplashScreen.hideAsync();
            // We already render the full UI, so no need to change appIsReady.
        }
    }, [fontsLoaded]);

    // Render the full UI immediately.
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
                            backgroundColor={COLORS.AppBackground}
                        />
                        <SafeAreaView
                            style={{
                                flex: 1,
                                backgroundColor: COLORS.AppBackground,
                            }}
                            edges={['top', 'left', 'right', 'bottom']}
                        >
                            <CustomScrollbar />
                            <ApolloProvider client={client}>
                                <ReduxProvider store={store}>
                                    <PortalProvider>
                                        <StatusManager>
                                            <Component {...pageProps} />
                                            <Toast />
                                        </StatusManager>
                                    </PortalProvider>
                                </ReduxProvider>
                            </ApolloProvider>
                        </SafeAreaView>
                    </SafeAreaProvider>
                </CurrentCommentProvider>
            </SearchProvider>
        </ActiveGroupProvider>
    );
}
