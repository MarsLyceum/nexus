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
import { onError, ErrorResponse } from '@apollo/client/link/error';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';

import { SignInScreen, SignUpScreen } from './src';
import {SetupScreen} from "./src/SetupScreen";

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

const serverIp = '192.168.1.141';

const link = from([
    errorLink,
    new HttpLink({ uri: `http://${serverIp}:4000/graphql` }),
]);

const client = new ApolloClient({
    link,
    cache: new InMemoryCache(),
});

// we need to have App be a default export for React Native to work
// eslint-disable-next-line import/no-default-export
export default function App() {
    return (
        <ApolloProvider client={client}>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="SignIn">
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="Setup" component={SetupScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </ApolloProvider>
    );
}
