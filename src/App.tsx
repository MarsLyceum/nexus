// src/App.tsx

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import {
    createDrawerNavigator,
    DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import EventSource from 'react-native-event-source';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
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
import { getMainDefinition } from '@apollo/client/utilities';
import {
    useFonts,
    Lato_400Regular,
    Lato_700Bold,
} from '@expo-google-fonts/lato';
import * as SplashScreen from 'expo-splash-screen';

import { COLORS } from './constants';
import { setupAxiosQuotas } from './utils/setupAxiosQuotas';
import { store } from './redux';
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
} from './screens';

// Initialize Axios quotas
setupAxiosQuotas();

// Initialize development messages only in dev environment
if (__DEV__) {
    // Uncomment if you have loadDevMessages and loadErrorMessages implementations
    // loadDevMessages();
    // loadErrorMessages();
}

// **Define the parameter lists for navigators**
type RootStackParamList = {
    Welcome: undefined;
    Login: undefined;
    SignUp: undefined;
    AppDrawer: undefined;
    Chat: { user: { name: string; avatar: string } };
    ServerMessages: { channel: string };
};

type RootDrawerParamList = {
    DMs: undefined;
    Events: undefined;
    Server1: { channel: string };
    Server2: { channel: string };
};

// **Create typed navigators**
const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// **Error handling link for Apollo Client**
const errorLink = onError((error: ErrorResponse) => {
    if (error) {
        console.log('Apollo Client Error:', error);
    }
});

// **Apollo Client Quota Management**
const requestQuota = 10;
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

// **Define your GraphQL endpoints**
const graphqlApiGatewayEndpointHttp =
    'https://peeps-web-service-iwesf7iypq-uw.a.run.app/graphql';
// const localGraphqlApiGatewayEndpointHttp = 'http://localhost:4000/graphql';
// const graphqlApiGatewayEndpointSse =
//     'https://peeps-web-service-iwesf7iypq-uw.a.run.app/graphql/stream';
const graphqlApiGatewayEndpointSse = ''; // SSE is turned off to save costs

// **HTTP Link for Apollo Client**
const httpLink = from([
    errorLink,
    new HttpLink({
        uri: graphqlApiGatewayEndpointHttp,
    }),
]);

// **SSE Link for Apollo Client (if enabled)**
const sseLink = new ApolloLink(
    () =>
        new Observable((observer) => {
            if (!graphqlApiGatewayEndpointSse) {
                observer.complete();
                return;
            }

            const eventSource: EventSource = new EventSource(
                graphqlApiGatewayEndpointSse,
                {
                    withCredentials: false,
                }
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

            // eslint-disable-next-line consistent-return
            return () => {
                eventSource.close();
            };
        })
);

// **Split link to handle subscriptions if SSE is enabled**
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

// **Initialize Apollo Client**
const client = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache(),
});

// **Define GraphQL Subscriptions (if needed)**
const GREETINGS_SUBSCRIPTION = gql`
    subscription OnGreeting {
        greetings
    }
`;

// **Subscribe to Greetings (optional)**
client
    .subscribe({
        query: GREETINGS_SUBSCRIPTION,
    })
    .subscribe({
        next({ data }) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            console.log('Greeting:', data.greetings);
        },
        error(err) {
            console.error('Subscription error:', err);
        },
    });

// **Custom Drawer Content Component**
const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => (
    <SidebarScreen {...props} />
);

// **Drawer Navigator Component**
function AppDrawer() {
    return (
        <Drawer.Navigator
            screenOptions={{
                drawerType: 'permanent', // Always visible
                drawerStyle: {
                    width: 80,
                    borderWidth: 0,
                    backgroundColor: COLORS.AppBackground,
                }, // Adjust width as needed
            }}
            drawerContent={(drawerProps) => (
                <CustomDrawerContent {...drawerProps} />
            )}
        >
            <Drawer.Screen
                name="DMs"
                component={DMListScreen}
                options={{ headerShown: false }}
            />
            <Drawer.Screen
                name="Events"
                component={EventsScreen}
                options={{ headerShown: false }}
            />
            <Drawer.Screen
                name="Server1"
                // @ts-expect-error broken navigation
                component={ServerScreen}
                options={{ headerShown: false }}
                initialParams={{ channel: 'Server1Channel' }}
            />
            <Drawer.Screen
                name="Server2"
                // @ts-expect-error broken navigation
                component={ServerScreen}
                options={{ headerShown: false }}
                initialParams={{ channel: 'Server2Channel' }}
            />
        </Drawer.Navigator>
    );
}

// **Splash Screen Handling**
SplashScreen.preventAutoHideAsync().catch(console.warn);

// **Main App Component**
export function App() {
    const [appIsReady, setAppIsReady] = useState(false);

    const [fontsLoaded] = useFonts({
        Lato_400Regular,
        Lato_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync()
                .then(() => setAppIsReady(true))
                .catch(console.warn);
        }
    }, [fontsLoaded]);

    if (appIsReady) {
        return (
            <SafeAreaProvider>
                <StatusBar
                    barStyle="light-content"
                    backgroundColor={COLORS.AppBackground}
                />
                <SafeAreaView
                    style={{ flex: 1, backgroundColor: COLORS.AppBackground }}
                    edges={['top', 'left', 'right']}
                >
                    <ApolloProvider client={client}>
                        <ReduxProvider store={store}>
                            <NavigationContainer
                                onReady={() => {
                                    console.log('Navigation is ready');
                                }}
                            >
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
                                    <Stack.Screen
                                        name="AppDrawer"
                                        component={AppDrawer}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="Chat"
                                        // @ts-expect-error broken navigation
                                        component={ChatScreen}
                                        options={{ headerShown: false }}
                                    />
                                    <Stack.Screen
                                        name="ServerMessages"
                                        // @ts-expect-error broken navigation
                                        component={ServerMessagesScreen}
                                        options={{ headerShown: false }}
                                    />
                                </Stack.Navigator>
                            </NavigationContainer>
                        </ReduxProvider>
                    </ApolloProvider>
                </SafeAreaView>
            </SafeAreaProvider>
        );
    }
}
