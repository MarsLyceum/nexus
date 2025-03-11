import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
    createStackNavigator,
    TransitionPresets,
} from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { createClient } from 'graphql-ws';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import Toast from 'react-native-toast-message';
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    from,
    ApolloLink,
    Observable,
    split,
    gql,
} from '@apollo/client';
import { Provider as ReduxProvider } from 'react-redux';
import { onError, ErrorResponse } from '@apollo/client/link/error';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';
import { getMainDefinition } from '@apollo/client/utilities';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import {
    useFonts,
    Roboto_400Regular,
    Roboto_400Regular_Italic,
    Roboto_500Medium,
    Roboto_500Medium_Italic,
    Roboto_700Bold,
    Roboto_700Bold_Italic,
} from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';
import { Provider as PortalProvider } from 'react-native-paper';

import { linking } from './linking';
import { COLORS } from './constants';
import { setupAxiosQuotas } from './utils/setupAxiosQuotas';
import { store } from './redux';
import {
    LoginScreen,
    SignUpScreen,
    WelcomeScreen,
    ChatScreen,
    ServerMessagesScreen,
    CreateGroupModalScreen,
    FeedChannelScreen,
    PostScreen,
    GroupEventsScreen,
    EventDetailsScreen,
    AppDrawerScreen,
    CreateCommentScreen,
    AddFriendsScreen,
} from './screens';
import {
    SearchProvider,
    ActiveGroupProvider,
    CurrentCommentProvider,
} from './providers';

setupAxiosQuotas();

if (__DEV__) {
    loadDevMessages();
    loadErrorMessages();
}

/**
 * CustomScrollbar Component
 *
 * This component injects custom CSS to style scrollbars on web.
 * On native platforms, it renders null.
 */
const CustomScrollbar = () => {
    if (Platform.OS !== 'web') return <></>;
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

const MainStack = createStackNavigator();
const RootStack = createStackNavigator();

const errorLink = onError((error: ErrorResponse) => {
    if (error) {
        console.log('Apollo Error:', error);
    }
});

const requestQuota = 20;
let requestCount = 0;
const quotaLink = new ApolloLink((operation, forward) => {
    if (requestCount < requestQuota) {
        requestCount += 1;
        return forward(operation);
    }
    console.error('Request quota exceeded');
    return new Observable((observer) => {
        observer.error(new Error('Request quota exceeded'));
    });
});

// const graphqlApiGatewayEndpointHttp =
//     'https://nexus-web-service-197277044151.us-west1.run.app/graphql';
// const graphqlApiGatewayEndpointWs =
//     'wss://nexus-web-service-197277044151.us-west1.run.app/graphql';
// const graphqlApiGatewayEndpointSse = ''; // SSE turned off

const httpLink = from([
    errorLink,
    createUploadLink({
        // uri: graphqlApiGatewayEndpointHttp,
        uri: 'http://192.168.1.48:4000/graphql',
        // @ts-expect-error boolean
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        isExtractableFile: (value: any) => {
            if (value === undefined || value === null) return false;
            // On web: if value is a native File or Blob, it’s fine.
            if (typeof File !== 'undefined' && value instanceof File)
                return true;
            if (typeof Blob !== 'undefined' && value instanceof Blob)
                return true;
            // For our custom file object, check that it has uri, name, and type.
            if (
                typeof value === 'object' &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                typeof value.uri === 'string' &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                typeof value.name === 'string' &&
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                typeof value.type === 'string'
            ) {
                // On web, if the file object doesn’t have a createReadStream, add a dummy.
                if (
                    Platform.OS === 'web' &&
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
        // url: graphqlApiGatewayEndpointWs,
        url: 'ws://192.168.1.48:4000/graphql', // Ensure this URL matches your WS server endpoint
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
    from([quotaLink, httpLink])
);

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});

function MainStackScreen() {
    return (
        <MainStack.Navigator
            initialRouteName="Welcome"
            screenOptions={{ headerShown: false }}
        >
            <MainStack.Screen name="Welcome" component={WelcomeScreen} />
            <MainStack.Screen name="Login" component={LoginScreen} />
            <MainStack.Screen name="SignUp" component={SignUpScreen} />
            <MainStack.Screen name="AppDrawer" component={AppDrawerScreen} />
            {/* @ts-expect-error navigator */}
            <MainStack.Screen name="Chat" component={ChatScreen} />
            <MainStack.Screen name="AddFriends" component={AddFriendsScreen} />
            <MainStack.Screen
                name="ServerMessages"
                component={ServerMessagesScreen}
            />
            <MainStack.Screen
                name="FeedChannel"
                // @ts-expect-error navigator
                component={FeedChannelScreen}
            />
            {/* @ts-expect-error navigator */}
            <MainStack.Screen name="PostScreen" component={PostScreen} />
            <MainStack.Screen
                name="GroupEvents"
                component={GroupEventsScreen}
            />
            <MainStack.Screen
                name="EventDetails"
                // @ts-expect-error navigator
                component={EventDetailsScreen}
            />
            <MainStack.Screen
                name="CreateComment"
                component={CreateCommentScreen}
            />
        </MainStack.Navigator>
    );
}

// The main App component with the stack navigator integrating all screens.
// eslint-disable-next-line import/no-default-export
export default function App() {
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
            // eslint-disable-next-line no-void
            void SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    if (appIsReady) {
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
                                {/* Inject custom scrollbar styles on web */}
                                <CustomScrollbar />
                                <ApolloProvider client={client}>
                                    <ReduxProvider store={store}>
                                        <PortalProvider>
                                            <NavigationContainer
                                                linking={linking}
                                            >
                                                <RootStack.Navigator
                                                    screenOptions={{
                                                        headerShown: false,
                                                        presentation:
                                                            'transparentModal', // This makes the screens render as modals by default
                                                    }}
                                                >
                                                    <RootStack.Screen
                                                        name="Main"
                                                        component={
                                                            MainStackScreen
                                                        }
                                                    />
                                                    <RootStack.Screen
                                                        name="CreateGroup"
                                                        // @ts-expect-error navigator
                                                        component={
                                                            CreateGroupModalScreen
                                                        }
                                                        options={{
                                                            presentation:
                                                                'transparentModal',
                                                            cardStyle: {
                                                                backgroundColor:
                                                                    'transparent',
                                                            },
                                                            ...Platform.select({
                                                                ios: TransitionPresets.ModalPresentationIOS,
                                                            }),
                                                        }}
                                                    />
                                                </RootStack.Navigator>
                                                <Toast />
                                            </NavigationContainer>
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
}
