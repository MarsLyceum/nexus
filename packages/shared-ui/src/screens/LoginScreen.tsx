import React, { useCallback, useState } from 'react';
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

import { useNexusRouter } from '../hooks';
import { loginUser, useAppDispatch } from '../redux';
import { LOGIN_USER } from '../queries';
import { validatePassword } from '../utils';
import { Email, Lock, GoogleLogo } from '../icons';
import { HorizontalLine } from '../images';
import { PrimaryGradientButton } from '../buttons';
import { User } from '../types';
import { COLORS } from '../constants';

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
}): JSX.Element {
    return (
        <Svg width={size} height={size} viewBox="0 0 512 512" style={style}>
            <Path
                fill={color}
                d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.8 90.4 226.7 208 245v-173H147v-72h69V200c0-68.7 41-106.7 104-106.7 30 0 62 5 62 5v68h-35c-34.4 0-45 21.3-45 43v52h76l-12 72h-64v173c117.6-18.3 208-121.2 208-245z"
            />
        </Svg>
    );
}

const styles = StyleSheet.create({
    topButton: {
        marginTop: 38,
        marginBottom: 80,
    },
    outerContainer: {
        flex: 1,
        backgroundColor: COLORS.AppBackground,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.PrimaryBackground,
    },
    image: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.MainText,
        marginTop: 20, // Changed from -125 to 20 to keep content within view
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.InactiveText,
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginTop: 15,
        marginBottom: 15,
        height: 50,
        alignItems: 'center',
    },
    input: {
        borderColor: COLORS.OffWhite,
        height: 45,
        flex: 1,
        fontSize: 16,
        marginRight: 5,
        backgroundColor: COLORS.TextInput,
        color: COLORS.MainText,
        paddingHorizontal: 10,
    },
    orText: {
        fontSize: 16,
        color: COLORS.InactiveText,
        marginVertical: 15,
        textAlign: 'center',
        marginLeft: 20,
        marginRight: 20,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '40%',
    },
    socialButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        backgroundColor: COLORS.OffWhite,
        marginLeft: 10,
        marginRight: 10,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: COLORS.Primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        marginBottom: 15,
    },
    buttonText: {
        color: COLORS.White,
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotPasswordText: {
        fontSize: 16,
        color: COLORS.InactiveText,
        marginTop: 17,
        marginBottom: 53,
        textAlign: 'center',
    },
    forgotPasswordLink: {
        color: COLORS.Link,
        fontWeight: 'bold',
    },
    // Updated innerScrollContainer to use flex and a minHeight on web
    // @ts-expect-error web only
    innerScrollContainer: isWeb
        ? {
              flexGrow: 1,
              minHeight: '100vh',
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 20,
          }
        : {
              width: '100%',
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: 20,
          },
    orContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'center',
    },
    inputIcon: {
        marginRight: 10,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 285,
        borderColor: COLORS.OffWhite,
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 10,
        backgroundColor: COLORS.TextInput,
        height: 50,
        flex: 1,
        fontSize: 16,
    },
});

export function LoginScreen(): JSX.Element {
    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();
    const router = useNexusRouter();

    const [email, setEmail] = useState<string>(initialFormValues.email);
    const [password, setPassword] = useState<string>(
        initialFormValues.password
    );
    const [errors, setErrors] = useState<Partial<FormValues>>({});

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
            const result = await apolloClient.mutate<{ loginUser: User }>({
                mutation: LOGIN_USER,
                variables: { email: emailInner, password: passwordInner },
            });
            if (result.data?.loginUser) {
                const user = result.data.loginUser;
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
        // @ts-expect-error web only
        <SafeAreaView style={styles.outerContainer}>
            {/* @ts-expect-error web only */}
            <ScrollView contentContainerStyle={styles.innerScrollContainer}>
                {/* @ts-expect-error web only */}
                <View style={styles.container}>
                    {/* @ts-expect-error web only */}
                    <Text style={styles.title}>Log in</Text>

                    {/* @ts-expect-error web only */}
                    <View style={styles.inputContainer}>
                        {/* @ts-expect-error web only */}
                        <View style={styles.inputWrapper}>
                            {/* @ts-expect-error web only */}
                            <Email style={styles.inputIcon} />
                            <TextInput
                                placeholder="Enter your email"
                                // @ts-expect-error web only
                                style={styles.input}
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>
                    <Text style={{ color: 'red' }}>{errors.email}</Text>
                    {/* @ts-expect-error web only */}
                    <View style={styles.inputContainer}>
                        {/* @ts-expect-error web only */}
                        <View style={styles.inputWrapper}>
                            {/* @ts-expect-error web only */}
                            <Lock style={styles.inputIcon} />
                            <TextInput
                                placeholder="Password"
                                // @ts-expect-error web only
                                style={styles.input}
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                            />
                        </View>
                    </View>
                    <Text style={{ color: 'red' }}>{errors.password}</Text>

                    {/* @ts-expect-error web only */}
                    <Text style={styles.forgotPasswordText}>
                        <Pressable
                            onPress={() => router.push('/forgot-password')}
                        >
                            {/* @ts-expect-error web only */}
                            <Text style={styles.forgotPasswordLink}>
                                Forgot password?
                            </Text>
                        </Pressable>
                    </Text>

                    {/* @ts-expect-error web only */}
                    <View style={styles.orContainer}>
                        <HorizontalLine />
                        {/* @ts-expect-error web only */}
                        <Text style={styles.orText}>or log in with</Text>
                        <HorizontalLine />
                    </View>

                    {/* @ts-expect-error web only */}
                    <View style={styles.socialContainer}>
                        {/* @ts-expect-error web only */}
                        <Pressable style={styles.socialButton}>
                            <FacebookIcon size={24} color="#4267B2" />
                        </Pressable>
                        {/* @ts-expect-error web only */}
                        <Pressable style={styles.socialButton}>
                            <GoogleLogo />
                        </Pressable>
                    </View>

                    <PrimaryGradientButton
                        // @ts-expect-error web only
                        style={styles.topButton}
                        title="Login"
                        onPress={handleSubmit}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
