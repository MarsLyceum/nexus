// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
    createStackNavigator,
    TransitionPresets,
} from '@react-navigation/stack';
import EventSource from 'react-native-event-source';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar, TouchableOpacity } from 'react-native';
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
import {
    useFonts,
    Lato_400Regular,
    Lato_700Bold,
} from '@expo-google-fonts/lato';
import * as SplashScreen from 'expo-splash-screen';

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
} from './screens';

setupAxiosQuotas();

if (__DEV__) {
    loadDevMessages();
    loadErrorMessages();
}

const DrawerNavigator = createDrawerNavigator();
const Stack = createStackNavigator();

const errorLink = onError((error: ErrorResponse) => {
    if (error) {
        console.log('Apollo Error:', error);
    }
});

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

// AppDrawer: Your drawer navigator for main sections of your app.
function AppDrawer() {
    const userGroups: UserGroupsType = useAppSelector(
        (state: RootState) => state.userGroups.userGroups
    );

    return (
        <DrawerNavigator.Navigator
            screenOptions={{
                drawerType: 'permanent',
                drawerStyle: {
                    width: 80,
                    borderWidth: 0,
                    backgroundColor: COLORS.AppBackground,
                },
            }}
            drawerContent={(props) => <SidebarScreen {...props} />}
        >
            <DrawerNavigator.Screen
                name="DMs"
                component={DMListScreen}
                options={{ headerShown: false }}
            />
            <DrawerNavigator.Screen
                name="Events"
                component={EventsScreen}
                options={{ headerShown: false }}
            />
            {userGroups.map((group) => (
                <DrawerNavigator.Screen
                    name={group.name}
                    key={group.id}
                    component={ServerScreen}
                    initialParams={{ group }}
                    options={{ headerShown: false }}
                />
            ))}
        </DrawerNavigator.Navigator>
    );
}

// The main App component with the stack navigator integrating all screens,
// including FeedChannelScreen and PostScreen from the old feed channel navigator.
export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);
    const [fontsLoaded] = useFonts({
        Lato_400Regular,
        Lato_700Bold,
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
                                <Stack.Screen
                                    name="AppDrawer"
                                    component={AppDrawer}
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
                                {/* Integrated FeedChannelScreen and PostScreen */}
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
                            </Stack.Navigator>
                        </NavigationContainer>
                    </ReduxProvider>
                </ApolloProvider>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}
