import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    ApolloClient,
    InMemoryCache,
    ApolloProvider,
    from,
    HttpLink,
} from '@apollo/client';
import { Provider as ReduxProvider } from 'react-redux';
import { onError, ErrorResponse } from '@apollo/client/link/error';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';
import {
    useFonts,
    Lato_400Regular,
    Lato_700Bold,
} from '@expo-google-fonts/lato';

import { store } from './src/redux/store';
import {
    SignInScreen,
    SignUpScreen,
    MatchingScreen,
    WelcomeScreen,
} from './src';
import { SetupScreen } from './src/SetupScreen';

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

const link = from([
    errorLink,
    new HttpLink({
        uri: `https://hephaestus-api-iwesf7iypq-uw.a.run.app/graphql`,
    }),
]);

const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
});

// we need to have App be a default export for React Native to work
// eslint-disable-next-line import/no-default-export
export default function App() {
    useFonts({
        Lato_400Regular,
        Lato_700Bold,
    });

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
                            name="SignIn"
                            component={SignInScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="SignUp"
                            component={SignUpScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Setup"
                            component={SetupScreen}
                            options={{ headerShown: false }}
                        />
                        <Stack.Screen
                            name="Matching"
                            component={MatchingScreen}
                            options={{ headerShown: false }}
                        />
                    </Stack.Navigator>
                </ReduxProvider>
            </NavigationContainer>
        </ApolloProvider>
    );
}
