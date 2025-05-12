// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable import/first */
import 'react-native-get-random-values';

import React, { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { NavigationContainer } from '@react-navigation/native';
import {
    createStackNavigator,
    TransitionPresets,
} from '@react-navigation/stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Platform, StatusBar, View, Text, Button } from 'react-native';
import Toast from 'react-native-toast-message';
import { ApolloProvider } from '@apollo/client';
import { Provider as ReduxProvider } from 'react-redux';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';
import { Lato_400Regular, Lato_700Bold } from '@expo-google-fonts/lato';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

import { store } from 'shared-ui/redux';
import { useTheme, ThemeProvider } from 'shared-ui/theme';
import {
    SearchProvider,
    ActiveGroupProvider,
    CurrentCommentProvider,
    PortalProvider,
} from 'shared-ui/providers';
import { StatusManager, Login } from 'shared-ui/small-components';
import {
    LoginScreen,
    SignUpScreen,
    WelcomeScreen,
    ChatScreen,
    GroupChannelScreen,
    CreateGroupModalScreen,
    FeedChannelScreen,
    PostScreen,
    GroupEventsScreen,
    EventDetailsScreen,
    CreateCommentScreen,
    AddFriendsScreen,
} from 'shared-ui/screens';
import { createApolloClient } from 'shared-ui/utils';
import { AppDrawerScreen } from './AppDrawerScreen';
import { linking } from './linking';

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
    const { theme } = useTheme();
    if (Platform.OS !== 'web') return <></>;
    return (
        <style>{`
      /* Chrome, Safari and Opera */
      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      ::-webkit-scrollbar-track {
        background: ${theme.colors.PrimaryBackground};
      }
      ::-webkit-scrollbar-thumb {
        background-color: ${theme.colors.TextInput};
        border-radius: 999px;
      }
      /* Firefox */
      * {
        scrollbar-width: thin;
        scrollbar-color: ${theme.colors.TextInput} ${theme.colors.PrimaryBackground};
      }
    `}</style>
    );
};

const MainStack = createStackNavigator();
const RootStack = createStackNavigator();

const client = createApolloClient();

function MainStackScreen() {
    return (
        <MainStack.Navigator
            initialRouteName="welcome"
            screenOptions={{ headerShown: false }}
        >
            <MainStack.Screen
                name="welcome"
                component={WelcomeScreen}
                options={{ unmountOnBlur: true }}
            />
            <MainStack.Screen name="login" component={LoginScreen} />
            <MainStack.Screen name="signup" component={SignUpScreen} />
            <MainStack.Screen name="dashboard" component={AppDrawerScreen} />
            <MainStack.Screen name="chat" component={ChatScreen} />
            <MainStack.Screen name="add-friends" component={AddFriendsScreen} />
            <MainStack.Screen
                name="group-channel"
                component={GroupChannelScreen}
            />
            <MainStack.Screen
                name="feedchannel"
                component={FeedChannelScreen}
            />
            <MainStack.Screen name="post" component={PostScreen} />
            <MainStack.Screen
                name="groupevents"
                component={GroupEventsScreen}
            />
            <MainStack.Screen
                name="event-details"
                // @ts-expect-error navigator
                component={EventDetailsScreen}
            />
            <MainStack.Screen
                name="create-comment"
                component={CreateCommentScreen}
            />
        </MainStack.Navigator>
    );
}

const AppContent = () => {
    const { theme } = useTheme();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ActiveGroupProvider>
                <SearchProvider>
                    <CurrentCommentProvider>
                        <SafeAreaProvider>
                            <StatusBar
                                barStyle="light-content"
                                backgroundColor={theme.colors.AppBackground}
                            />
                            <SafeAreaView
                                style={{
                                    flex: 1,
                                    backgroundColor: theme.colors.AppBackground,
                                }}
                                edges={['top', 'left', 'right', 'bottom']}
                            >
                                {/* Inject custom scrollbar styles on web */}
                                <CustomScrollbar />
                                <ApolloProvider client={client}>
                                    <ReduxProvider store={store}>
                                        <PortalProvider>
                                            <Login>
                                                <NavigationContainer
                                                    linking={linking}
                                                >
                                                    <StatusManager>
                                                        <RootStack.Navigator
                                                            screenOptions={{
                                                                headerShown:
                                                                    false,
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
                                                                    ...Platform.select(
                                                                        {
                                                                            ios: TransitionPresets.ModalPresentationIOS,
                                                                        }
                                                                    ),
                                                                }}
                                                            />
                                                        </RootStack.Navigator>
                                                        <Toast />
                                                    </StatusManager>
                                                </NavigationContainer>
                                            </Login>
                                        </PortalProvider>
                                    </ReduxProvider>
                                </ApolloProvider>
                            </SafeAreaView>
                        </SafeAreaProvider>
                    </CurrentCommentProvider>
                </SearchProvider>
            </ActiveGroupProvider>
        </GestureHandlerRootView>
    );
};

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
    const [stack, setStack] = useState<string | undefined>();

    useEffect(() => {
        if (fontsLoaded) {
            // eslint-disable-next-line no-void
            void SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    if (appIsReady) {
        return (
            <ErrorBoundary
                // 1. Log & stash the componentStack when the error fires
                onError={(error, info) => {
                    console.log('🚨 Component stack:', info.componentStack);
                    setStack(info.componentStack ?? undefined);
                }}
                // 2. Render a fallback UI—only gets error + reset, not the stack
                fallbackRender={({ error, resetErrorBoundary }) => (
                    <View style={{ padding: 16 }}>
                        <Text style={{ marginBottom: 8 }}>
                            Error: {error.message}
                        </Text>
                        {stack && (
                            <Text
                                style={{
                                    marginVertical: 8,
                                    fontFamily: 'monospace',
                                    fontSize: 12,
                                }}
                            >
                                {stack}
                            </Text>
                        )}
                        <Button
                            title="Try Again"
                            onPress={resetErrorBoundary}
                        />
                    </View>
                )}
            >
                <ThemeProvider>
                    <AppContent />
                </ThemeProvider>
            </ErrorBoundary>
        );
    }
}
