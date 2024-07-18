import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import RNEventSource from 'react-native-event-source';

import { setupAxiosQuotas } from './utils/setupAxiosQuotas';
import { store } from './redux';
import { LoginScreen, SignUpScreen, MatchingScreen, WelcomeScreen } from '.';
import { HomeScreen } from './HomeScreen'
import { GroupsScreen } from "./GroupsScreen";
import { MessagesScreen } from "./MessagesScreen";
import { FriendsScreen } from "./FriendsScreen";

setupAxiosQuotas();

if (__DEV__) {
    // Adds messages only in a dev environment
    loadDevMessages();
    loadErrorMessages();
}

const Stack = createNativeStackNavigator();

const errorLink = onError((error: ErrorResponse) => {
    if (error) {
        console.log('error:', error);
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
    'https://hephaestus-api-iwesf7iypq-uw.a.run.app/graphql';
const graphqlApiGatewayEndpointSse =
    'https://hephaestus-api-iwesf7iypq-uw.a.run.app/graphql/stream';
const localGraphqlApiGatewayEndpointSse =
    'http://localhost:4000/graphql/stream';

const httpLink = from([
    errorLink,
    new HttpLink({
        uri: graphqlApiGatewayEndpointHttp,
    }),
]);

const sseLink = new ApolloLink((operation) => {
    return new Observable((observer) => {
        const eventSource = new EventSource(graphqlApiGatewayEndpointSse, {
            withCredentials: false,
        });

        eventSource.onmessage = (event: MessageEvent) => {
            try {
                const parsedData = JSON.parse(event.data);
                if (parsedData.errors) {
                    observer.error(parsedData.errors);
                } else {
                    observer.next({
                        data: { greetings: parsedData.greetings },
                    });
                }
            } catch (err) {
                observer.error(err);
            }
        };

        eventSource.onerror = (error) => {
            observer.error(error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    });
});

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

client
    .subscribe({
        query: GREETINGS_SUBSCRIPTION,
    })
    .subscribe({
        next({ data }) {
            console.log('Greeting:', data.greetings);
        },
        error(err) {
            console.error('Subscription error:', err);
        },
    });

// we need to have App be a default export for React Native to work
// eslint-disable-next-line import/no-default-export
export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);

    const [fontsLoaded] = useFonts({
        Lato_400Regular,
        Lato_700Bold,
    });

    useEffect(() => {
        if (fontsLoaded) {
            // eslint-disable-next-line no-void
            void SplashScreen.hideAsync(); // Hide the splash screen once the fonts are loaded
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    if (appIsReady) {
        return (
            <ApolloProvider client={client}>
                <NavigationContainer>
                    <ReduxProvider store={store}>
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
                                name="Matching"
                                component={MatchingScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="Home"
                                component={HomeScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="Groups"
                                component={GroupsScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="Messages"
                                component={MessagesScreen}
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="Friends"
                                component={FriendsScreen}
                                options={{ headerShown: false }}
                            />
                        </Stack.Navigator>
                    </ReduxProvider>
                </NavigationContainer>
            </ApolloProvider>
        );
    }

    return null;
}
