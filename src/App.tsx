import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
    createStackNavigator,
    TransitionPresets,
} from '@react-navigation/stack';
import EventSource from 'react-native-event-source';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    from,
    HttpLink,
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
    Roboto_500Medium,
    Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';

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
} from './screens';
import { SearchProvider } from './providers';

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

const graphqlApiGatewayEndpointHttp =
    'https://peeps-web-service-iwesf7iypq-uw.a.run.app/graphql';
const graphqlApiGatewayEndpointSse = ''; // SSE turned off

const httpLink = from([
    errorLink,
    new HttpLink({
        uri: graphqlApiGatewayEndpointHttp,
    }),
]);

const sseLink = new ApolloLink(
    () =>
        new Observable((observer) => {
            const eventSource: EventSource = new EventSource(
                graphqlApiGatewayEndpointSse,
                { withCredentials: false }
            );
            eventSource.addEventListener(
                'message',
                (event: { data: string }) => {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                        const parsedData = JSON.parse(event.data);
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                        if (parsedData.errors) {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                            observer.error(parsedData.errors);
                        } else {
                            observer.next({
                                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                                data: { greetings: parsedData.greetings },
                            });
                        }
                    } catch (error) {
                        observer.error(error);
                    }
                }
            );
            eventSource.addEventListener('error', (error: unknown) => {
                observer.error(error);
                eventSource.close();
            });
            return () => {
                eventSource.close();
            };
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
    sseLink,
    from([quotaLink, httpLink])
);

const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});

const GREETINGS_SUBSCRIPTION = gql`
    subscription OnGreeting {
        greetings
    }
`;

client.subscribe({ query: GREETINGS_SUBSCRIPTION }).subscribe({
    next({ data }) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.log('Greeting:', data.greetings);
    },
    error(err) {
        console.error('Subscription error:', err);
    },
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
            <MainStack.Screen name="Chat" component={ChatScreen} />
            <MainStack.Screen
                name="ServerMessages"
                component={ServerMessagesScreen}
            />
            <MainStack.Screen
                name="FeedChannel"
                component={FeedChannelScreen}
            />
            <MainStack.Screen name="PostScreen" component={PostScreen} />
            <MainStack.Screen
                name="GroupEvents"
                component={GroupEventsScreen}
            />
            <MainStack.Screen
                name="EventDetails"
                component={EventDetailsScreen}
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
        Roboto_500Medium,
        Roboto_700Bold,
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
            <SearchProvider>
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
                                <NavigationContainer>
                                    <RootStack.Navigator
                                        screenOptions={{
                                            headerShown: false,
                                            presentation: 'transparentModal', // This makes the screens render as modals by default
                                        }}
                                    >
                                        <RootStack.Screen
                                            name="Main"
                                            component={MainStackScreen}
                                        />
                                        <RootStack.Screen
                                            name="CreateGroup"
                                            component={CreateGroupModalScreen}
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
                                </NavigationContainer>
                            </ReduxProvider>
                        </ApolloProvider>
                    </SafeAreaView>
                </SafeAreaProvider>
            </SearchProvider>
        );
    }
}
