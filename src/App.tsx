import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
    createStackNavigator,
    TransitionPresets,
} from '@react-navigation/stack';
import EventSource from 'react-native-event-source';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
    Platform,
    StatusBar,
    View,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
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
import FontAwesome from 'react-native-vector-icons/FontAwesome';

import { COLORS } from './constants';
import { setupAxiosQuotas } from './utils/setupAxiosQuotas';
import { useAppSelector, RootState, UserGroupsType, store } from './redux';
import {
    ServerScreen,
    SidebarScreen,
    LoginScreen,
    SignUpScreen,
    WelcomeScreen,
    ChatScreen,
    DMListScreen,
    EventsScreen,
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

const Stack = createStackNavigator();

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
                        const parsedData = JSON.parse(event.data);
                        if (parsedData.errors) {
                            observer.error(parsedData.errors);
                        } else {
                            observer.next({
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
        console.log('Greeting:', data.greetings);
    },
    error(err) {
        console.error('Subscription error:', err);
    },
});

// The main App component with the stack navigator integrating all screens.
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
            SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    if (!appIsReady) {
        return null;
    }

    return (
        <SearchProvider>
            <SafeAreaProvider>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={COLORS.AppBackground}
                />
                <SafeAreaView
                    style={{ flex: 1, backgroundColor: COLORS.AppBackground }}
                    edges={['top', 'left', 'right', 'bottom']}
                >
                    {/* Inject custom scrollbar styles on web */}
                    <CustomScrollbar />
                    <ApolloProvider client={client}>
                        <ReduxProvider store={store}>
                            <NavigationContainer>
                                <Stack.Navigator initialRouteName="Welcome">
                                    <Stack.Screen
                                        name="Welcome"
                                        component={WelcomeScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="Login"
                                        component={LoginScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="SignUp"
                                        component={SignUpScreen}
                                        options={{ headerShown: false }}
                                    />
                                    {/* The AppDrawer now supplies its own header (if needed) */}
                                    <Stack.Screen
                                        name="AppDrawer"
                                        component={AppDrawerScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="Chat"
                                        component={ChatScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="ServerMessages"
                                        component={ServerMessagesScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="CreateGroup"
                                        component={CreateGroupModalScreen}
                                        options={{
                                            presentation: 'modal',
                                            ...Platform.select({
                                                ios: {
                                                    ...TransitionPresets.ModalPresentationIOS,
                                                },
                                            }),
                                        }}
                                    />
                                    <Stack.Screen
                                        name="FeedChannel"
                                        component={FeedChannelScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="PostScreen"
                                        component={PostScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="GroupEvents"
                                        component={GroupEventsScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="EventDetails"
                                        component={EventDetailsScreen}
                                        options={{ headerShown: false }}
                                    />
                                </Stack.Navigator>
                            </NavigationContainer>
                        </ReduxProvider>
                    </ApolloProvider>
                </SafeAreaView>
            </SafeAreaProvider>
        </SearchProvider>
    );
}
