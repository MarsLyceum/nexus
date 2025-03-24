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
import React, { useCallback } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/core';
import { Formik, FormikErrors } from 'formik';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';

import { User } from '../types';
import { loginUser, useAppDispatch } from '../redux';
import { LOGIN_USER } from '../queries';

import { validatePassword } from '../utils';

import { Email, Lock, GoogleLogo } from '../icons';
import { HorizontalLine } from '../images';
import { PrimaryGradientButton } from '../PrimaryGradientButton';

import { COLORS } from '../constants';

const isWeb = Platform.OS === 'web';

type FormValues = { email: string; password: string };
const initialFormValues: FormValues = { email: '', password: '' };

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
    innerScrollContainer: isWeb
        ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
          }
        : {
              width: '100%',
              flexGrow: 1,
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

export function LoginScreen({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) {
    const dispatch = useAppDispatch();
    const apolloClient = useApolloClient();

    const updateUserData = useCallback(
        (user: User) => {
            dispatch(loginUser(user));
        },
        [dispatch]
    );

    const validateEmailPassword = useCallback((values: FormValues) => {
        const errors: FormikErrors<FormValues> = {};

        if (!isEmail(values.email)) {
            errors.email = `${values.email} is not a valid email.`;
        }

        const passwordError = validatePassword(values.password);
        if (passwordError) {
            errors.password = passwordError;
        }

        return errors;
    }, []);

    const handleLoginUser = async (email: string, password: string) => {
        try {
            const result = await apolloClient.mutate<{ loginUser: User }>({
                mutation: LOGIN_USER,
                variables: { email, password },
            });
            if (result.data?.loginUser) {
                const user = result.data.loginUser;
                updateUserData(user);
                navigation.navigate('AppDrawer');
            } else {
                console.error('Login failed: No user data returned.');
            }
        } catch (error) {
            console.error('GraphQL login failed:', error);
        }
    };

    return (
        <SafeAreaView style={styles.outerContainer}>
            <ScrollView contentContainerStyle={styles.innerScrollContainer}>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={async (values): Promise<void> => {
                        await handleLoginUser(values.email, values.password);
                    }}
                    validate={validateEmailPassword}
                    validateOnChange={false}
                    validateOnBlur={false}
                >
                    {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        values,
                        errors,
                    }) => (
                        <View style={styles.container}>
                            <Text style={styles.title}>Log in</Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <Email style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Enter your email"
                                        style={styles.input}
                                        keyboardType="email-address"
                                        value={values.email}
                                        onBlur={handleBlur('email')}
                                        onChangeText={handleChange('email')}
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
                                        value={values.password}
                                        onBlur={handleBlur('password')}
                                        onChangeText={handleChange('password')}
                                    />
                                </View>
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.password}
                            </Text>

                            <Text style={styles.forgotPasswordText}>
                                <Pressable
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.forgotPasswordLink}>
                                        Forgot password?
                                    </Text>
                                </Pressable>
                            </Text>

                            <View style={styles.orContainer}>
                                <HorizontalLine />
                                <Text style={styles.orText}>
                                    or log in with
                                </Text>
                                <HorizontalLine />
                            </View>

                            <View style={styles.socialContainer}>
                                <Pressable style={styles.socialButton}>
                                    <FontAwesome
                                        name="facebook"
                                        size={24}
                                        color="#4267B2"
                                    />
                                </Pressable>
                                <Pressable style={styles.socialButton}>
                                    <GoogleLogo />
                                </Pressable>
                            </View>

                            <PrimaryGradientButton
                                style={styles.topButton}
                                title="Login"
                                onPress={handleSubmit as unknown as () => void}
                            />
                        </View>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
