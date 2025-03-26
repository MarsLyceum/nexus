// apps/web/pages/_app.tsx

// suppress useLayoutEffect (and its warnings) when not running in a browser
// https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
if (typeof window === 'undefined') React.useLayoutEffect = () => {};

import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { AppProps } from 'next/app';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    from,
    split,
} from '@apollo/client';
import { onError, ErrorResponse } from '@apollo/client/link/error';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { getMainDefinition } from '@apollo/client/utilities';
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

// CustomScrollbar component injects custom CSS on web.
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

// Setup Apollo Client links.
const errorLink = onError((error: ErrorResponse) => {
    if (error) {
        console.error('Apollo Error:', error);
    }
});

const isRunningLocally = false;
const graphqlApiGatewayEndpointHttp = isRunningLocally
    ? 'http://localhost:4000/graphql'
    : 'https://nexus-web-service-197277044151.us-west1.run.app/graphql';
const graphqlApiGatewayEndpointWs = isRunningLocally
    ? 'ws://localhost:4000/graphql'
    : 'wss://nexus-web-service-197277044151.us-west1.run.app/graphql';

const httpLink = from([
    errorLink,
    createUploadLink({
        uri: graphqlApiGatewayEndpointHttp,
        // Determine if value is an extractable file.
        // @ts-expect-error upload
        isExtractableFile: (value: any) => {
            if (value === undefined || value === null) return false;
            if (typeof File !== 'undefined' && value instanceof File)
                return true;
            if (typeof Blob !== 'undefined' && value instanceof Blob)
                return true;
            if (
                typeof value === 'object' &&
                typeof value.uri === 'string' &&
                typeof value.name === 'string' &&
                typeof value.type === 'string'
            ) {
                if (
                    Platform.OS === 'web' &&
                    typeof value.createReadStream !== 'function'
                ) {
                    Object.defineProperty(value, 'createReadStream', {
                        value: () => {
                            throw new Error(
                                'createReadStream is not supported on web'
                            );
                        },
                        writable: false,
                        enumerable: false,
                    });
                }
                return true;
            }
            return false;
        },
    }),
]);

const wsLink = new GraphQLWsLink(
    createClient({
        url: graphqlApiGatewayEndpointWs,
        webSocketImpl: ReconnectingWebSocket,
    })
);

const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink
);

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});

export default function App({ Component, pageProps }: AppProps) {
    const [appIsReady, setAppIsReady] = useState(false);
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
            SplashScreen.hideAsync();
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    if (!appIsReady) return null;

    return (
        <ActiveGroupProvider>
            <SearchProvider>
                <CurrentCommentProvider>
                    <SafeAreaProvider>
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
