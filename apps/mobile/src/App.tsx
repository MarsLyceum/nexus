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
import { Platform, StatusBar } from 'react-native';
import Toast from 'react-native-toast-message';
import { ApolloProvider } from '@apollo/client';
import { Provider as ReduxProvider } from 'react-redux';
import { loadErrorMessages, loadDevMessages } from '@apollo/client/dev';
import {
    Lato_400Regular,
    Lato_400Regular_Italic,
    Lato_700Bold,
    Lato_700Bold_Italic,
} from '@expo-google-fonts/lato';
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
import {
    Inter_400Regular,
    Inter_400Regular_Italic,
    Inter_600SemiBold,
    Inter_600SemiBold_Italic,
    Inter_700Bold,
    Inter_700Bold_Italic,
} from '@expo-google-fonts/inter';
import {
    SourceCodePro_400Regular,
    SourceCodePro_400Regular_Italic,
    SourceCodePro_500Medium,
    SourceCodePro_500Medium_Italic,
    SourceCodePro_700Bold,
    SourceCodePro_700Bold_Italic,
} from '@expo-google-fonts/source-code-pro';
import * as SplashScreen from 'expo-splash-screen';

import { store } from 'shared-ui/redux';
import { useTheme, ThemeProvider, ThemeContext } from 'shared-ui/theme';
import { COLORS } from 'shared-ui/constants/colors';
import {
    defaultFontConfig,
    createFontStyle,
    type FontConfig,
} from 'shared-ui/constants/fonts';
import {
    SearchProvider,
    ActiveGroupProvider,
    CurrentCommentProvider,
    PortalProvider,
    AnimationProvider,
} from 'shared-ui/providers';
import {
    StatusManager,
    Login,
    ErrorFallback,
} from 'shared-ui/small-components';
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
import { createApolloClient, useForceRefresh } from 'shared-ui/utils';
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

// Simulation removed; wrapper only handles real provider failures now

const buildFontStyles = (fontConfig: FontConfig) => {
    const make = (family: 'primary' | 'secondary' | 'monospace') => ({
        heading: createFontStyle(fontConfig, { weight: 'bold', family }),
        subheading: createFontStyle(fontConfig, { weight: 'semibold', family }),
        body: createFontStyle(fontConfig, { weight: 'regular', family }),
    });

    const primary = make('primary');
    const secondary = fontConfig.secondary ? make('secondary') : undefined;
    const monospace = fontConfig.monospace
        ? {
              ...make('monospace'),
              code: createFontStyle(fontConfig, {
                  weight: 'regular',
                  family: 'monospace',
              }),
          }
        : undefined;

    return { primary, secondary, monospace };
};

const fallbackThemeContextValue = {
    theme: { name: 'Default', colors: COLORS, fonts: defaultFontConfig },
    setThemeByName: () => {},
    setPrimaryFont: () => {},
    setSecondaryFont: () => {},
    setMonospaceFont: () => {},
    fontStyles: buildFontStyles(defaultFontConfig),
};

const ThemeProviderWithFallback: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => (
    // Catch failures in ThemeProvider and show ErrorFallback with a default theme
    <ErrorBoundary
        fallbackRender={({ error, resetErrorBoundary }) => (
            <ThemeContext.Provider value={fallbackThemeContextValue}>
                <ErrorFallback
                    error={error}
                    resetErrorBoundary={resetErrorBoundary}
                />
            </ThemeContext.Provider>
        )}
    >
        <ThemeProvider>{children}</ThemeProvider>
    </ErrorBoundary>
);

function MainStackScreen() {
    return (
        <MainStack.Navigator
            initialRouteName="welcome"
            screenOptions={{ headerShown: false }}
        >
            <MainStack.Screen name="welcome" component={WelcomeScreen} />
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
                                            <AnimationProvider>
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
                                                                        cardStyle:
                                                                            {
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
                                            </AnimationProvider>
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
    // Only load essential font weights to improve startup performance
    const [fontsLoaded] = useFonts({
        // Lato (semibold will fall back to bold)
        Lato_400Regular,
        Lato_400Regular_Italic,
        Lato_700Bold,
        Lato_700Bold_Italic,
        // Roboto
        Roboto_400Regular,
        Roboto_400Regular_Italic,
        Roboto_500Medium,
        Roboto_500Medium_Italic,
        Roboto_700Bold,
        Roboto_700Bold_Italic,
        // Inter (default secondary font)
        Inter_400Regular,
        Inter_400Regular_Italic,
        Inter_600SemiBold,
        Inter_600SemiBold_Italic,
        Inter_700Bold,
        Inter_700Bold_Italic,
        // Source Code Pro
        SourceCodePro_400Regular,
        SourceCodePro_400Regular_Italic,
        SourceCodePro_500Medium,
        SourceCodePro_500Medium_Italic,
        SourceCodePro_700Bold,
        SourceCodePro_700Bold_Italic,
    });
    const [stack, setStack] = useState<string | undefined>();
    const forceRefresh = useForceRefresh();

    useEffect(() => {
        if (fontsLoaded) {
            // eslint-disable-next-line no-void
            void SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
            setAppIsReady(true);
        }
    }, [fontsLoaded]);

    if (appIsReady) {
        return (
            <ThemeProviderWithFallback>
                <ErrorBoundary
                    onError={(_, info) => {
                        setStack(info.componentStack ?? undefined);
                    }}
                    fallbackRender={({ error, resetErrorBoundary }) => (
                        <AnimationProvider>
                            <ErrorFallback
                                error={error}
                                resetErrorBoundary={() => {
                                    resetErrorBoundary();
                                    forceRefresh();
                                }}
                                componentStack={stack}
                                onReset={() => setStack(undefined)}
                            />
                        </AnimationProvider>
                    )}
                >
                    <AppContent />
                </ErrorBoundary>
            </ThemeProviderWithFallback>
        );
    }
}
