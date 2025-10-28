import React, { useCallback, useState, useMemo } from 'react';
import {
    Text,
    View,
    TextInput,
    SafeAreaView,
    ScrollView,
    Pressable,
    StyleSheet,
    Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';

import {
    REFRESH_TOKEN_KEY,
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_EXPIRES_AT_KEY,
} from '../constants';
import { useNexusRouter } from '../hooks';
import { loginUser, useAppDispatch } from '../redux';
import { LOGIN_USER } from '../queries';
import { validatePassword, setItemSecure, toRgba } from '../utils';
import { Email, Lock, GoogleLogo } from '../icons';
import { HorizontalLine } from '../images';
import { PrimaryGradientButton } from '../buttons';
import { User } from '../types';
import { useTheme, Theme } from '../theme';
import {
    BorderRadius,
    Spacing,
    Opacity,
    Typography,
} from '../constants/designSystem';

const isWeb = Platform.OS === 'web';

type FormValues = { email: string; password: string };
const initialFormValues: FormValues = { email: '', password: '' };

// Custom FacebookIcon using react-native-svg to mimic the original FontAwesome icon
export function FacebookIcon({
    size = 24,
    color = '#4267B2',
    style,
}: {
    size?: number;
    color?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style?: any;
}): React.JSX.Element {
    return (
        <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
            <Path
                fill={color}
                d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.8 90.4 226.7 208 245v-173H147v-72h69V200c0-68.7 41-106.7 104-106.7 30 0 62 5 62 5v68h-35c-34.4 0-45 21.3-45 43v52h76l-12 72h-64v173c117.6-18.3 208-121.2 208-245z"
            />
        </Svg>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        topButton: {
            marginTop: Spacing.XXXL + Spacing.SM,
            marginBottom: Spacing.XXXL + Spacing.XXXL + Spacing.LG,
        },
        outerContainer: {
            flex: 1,
            backgroundColor: theme.colors.AppBackground,
        },
        container: {
            flex: 1,
            paddingHorizontal: Spacing.XL,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.PrimaryBackground,
        },
        image: {
            width: 100,
            height: 100,
            marginBottom: Spacing.XL,
        },
        title: {
            ...Typography.H1,
            fontFamily: theme.fonts.primary?.semibold,
            color: theme.colors.ActiveText,
            marginTop: Spacing.XL,
            textAlign: 'center',
        },
        subtitle: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.InactiveText,
            marginBottom: Spacing.XL,
            textAlign: 'center',
        },
        inputContainer: {
            width: '100%',
            marginTop: Spacing.LG,
            marginBottom: Spacing.LG,
            height: 50,
            alignItems: 'center',
        },
        input: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
            borderRadius: BorderRadius.Pill,
            height: 50,
            flex: 1,
            backgroundColor: theme.colors.TextInput,
            color: theme.colors.ActiveText,
            paddingHorizontal: Spacing.XL,
            marginRight: Spacing.XS,
        },
        orText: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.InactiveText,
            marginVertical: Spacing.LG,
            textAlign: 'center',
            marginLeft: Spacing.XL,
            marginRight: Spacing.XL,
        },
        socialContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40%',
        },
        socialButton: {
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: BorderRadius.ExtraLarge,
            backgroundColor: theme.colors.SecondaryBackground,
            marginLeft: Spacing.SM,
            marginRight: Spacing.SM,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
        },
        button: {
            width: '100%',
            height: 50,
            backgroundColor: theme.colors.Primary,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: BorderRadius.Pill,
            marginBottom: Spacing.LG,
            borderWidth: 1,
            borderColor: toRgba(theme.colors.ActiveText, Opacity.BorderMedium),
        },
        buttonText: {
            ...Typography.Button,
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.ActiveText,
        },
        forgotPasswordText: {
            ...Typography.Body,
            fontFamily: theme.fonts.primary?.regular,
            color: theme.colors.InactiveText,
            marginTop: Spacing.LG + Spacing.XS / 2,
            marginBottom: Spacing.XXXL + Spacing.XL + Spacing.XS,
            textAlign: 'center',
        },
        forgotPasswordLink: {
            fontFamily: theme.fonts.primary?.bold,
            color: theme.colors.Link,
        },
        innerScrollContainer: isWeb
            ? {
                  flexGrow: 1,
                  minHeight: '100vh',
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: Spacing.XL,
              }
            : {
                  width: '100%',
                  flexGrow: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingVertical: Spacing.XL,
              },
        orContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'center',
        },
        inputIcon: {
            marginRight: Spacing.MD,
        },
        inputWrapper: {
            flexDirection: 'row',
            alignItems: 'center',
            width: 285,
            borderColor: theme.colors.ActiveText,
            borderWidth: 1,
            borderRadius: BorderRadius.Pill,
            paddingHorizontal: Spacing.MD,
            backgroundColor: theme.colors.TextInput,
            height: 50,
            flex: 1,
        },
    });
}

export function LoginScreen(): React.JSX.Element {
    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();
    const router = useNexusRouter();

    const [email, setEmail] = useState<string>(initialFormValues.email);
    const [password, setPassword] = useState<string>(
        initialFormValues.password
    );
    const [errors, setErrors] = useState<Partial<FormValues>>({});
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const updateUserData = useCallback(
        (user: User) => {
            dispatch(loginUser(user));
        },
        [dispatch]
    );

    const validateEmailPassword = useCallback((values: FormValues) => {
        const errorsInner: Partial<FormValues> = {};

        if (!isEmail(values.email)) {
            errorsInner.email = `${values.email} is not a valid email.`;
        }

        const passwordError = validatePassword(values.password);
        if (passwordError) {
            errorsInner.password = passwordError;
        }

        return errorsInner;
    }, []);

    const handleLoginUser = async (
        emailInner: string,
        passwordInner: string
    ) => {
        try {
            const result = await apolloClient.mutate<{
                loginUser: User & {
                    token: string;
                    accessToken: string;
                    refreshToken: string;
                    refreshTokenExpiresAt: string;
                };
            }>({
                mutation: LOGIN_USER,
                variables: { email: emailInner, password: passwordInner },
            });
            if (result.data?.loginUser) {
                const {
                    token,
                    refreshToken,
                    accessToken,
                    refreshTokenExpiresAt,
                    ...user
                } = result.data.loginUser;

                if (Platform.OS !== 'web') {
                    await setItemSecure(ACCESS_TOKEN_KEY, accessToken);
                    await setItemSecure(REFRESH_TOKEN_KEY, refreshToken);
                    await setItemSecure(
                        REFRESH_TOKEN_EXPIRES_AT_KEY,
                        refreshTokenExpiresAt
                    );
                }

                updateUserData(user);
                // Navigate to AppDrawer screen
                router.push('/');
            } else {
                console.error('Login failed: No user data returned.');
            }
        } catch (error) {
            console.error('GraphQL login failed:', error);
        }
    };

    const handleSubmit = async () => {
        const currentValues: FormValues = { email, password };
        const validationErrors = validateEmailPassword(currentValues);
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length === 0) {
            await handleLoginUser(email, password);
        }
    };

    return (
        <SafeAreaView style={styles.outerContainer}>
            <ScrollView contentContainerStyle={styles.innerScrollContainer}>
                <View style={styles.container}>
                    <Text style={styles.title}>Log in</Text>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <Email style={styles.inputIcon} />
                            <TextInput
                                placeholder="Enter your email"
                                style={styles.input}
                                keyboardType="email-address"
                                autoComplete="username"
                                textContentType="emailAddress"
                                value={email}
                                onChangeText={setEmail}
                                {...(isWeb && {
                                    id: 'email',
                                    name: 'email',
                                    type: 'email',
                                })}
                            />
                        </View>
                    </View>
                    <Text style={{ color: 'red' }}>{errors.email}</Text>
                    <View style={styles.inputContainer}>
                        <View style={styles.inputWrapper}>
                            <Lock style={styles.inputIcon} />
                            <TextInput
                                placeholder="Password"
                                style={styles.input}
                                secureTextEntry
                                autoComplete="current-password"
                                textContentType="password"
                                value={password}
                                onChangeText={setPassword}
                                {...(isWeb && {
                                    id: 'password',
                                    name: 'password',
                                    type: 'password',
                                })}
                            />
                        </View>
                    </View>
                    <Text style={{ color: 'red' }}>{errors.password}</Text>

                    <Text style={styles.forgotPasswordText}>
                        <Pressable
                            onPress={() => router.push('/forgot-password')}
                        >
                            <Text style={styles.forgotPasswordLink}>
                                Forgot password?
                            </Text>
                        </Pressable>
                    </Text>

                    <View style={styles.orContainer}>
                        <HorizontalLine />
                        <Text style={styles.orText}>or log in with</Text>
                        <HorizontalLine />
                    </View>

                    <View style={styles.socialContainer}>
                        <Pressable style={styles.socialButton}>
                            <FacebookIcon size={24} color="#4267B2" />
                        </Pressable>
                        <Pressable style={styles.socialButton}>
                            <GoogleLogo />
                        </Pressable>
                    </View>

                    <PrimaryGradientButton
                        style={styles.topButton}
                        title="Login"
                        onPress={handleSubmit}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
