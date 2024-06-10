import {
    Text,
    View,
    TextInput,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import React, { useCallback } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/core';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';

import { User } from './types';
import { useUser } from './state';
import { LOGIN_USER_QUERY } from './queries';
import { validatePassword } from './utils';

import { Email, Lock, GoogleLogo } from './icons';
import { LoginIllustration, HorizontalLine } from './images';
import { PrimaryGradientButton } from './PrimaryGradientButton';

type FormValues = { email: string; password: string };
const initialFormValues = { email: '', password: '' };

const styles = StyleSheet.create({
    topButton: {
        marginTop: 38,
        marginBottom: 80,
    },
    outerContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    image: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginTop: -125,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
        height: 50,
        alignItems: 'center',
    },
    input: {
        // height: 50,
        // width: 285,
        // paddingHorizontal: 20,
        // fontSize: 16,
        // backgroundColor: '#f9f9f9',

        // flex: 1,
        // backgroundColor: '#f9f9f9',

        // old stuff, new stuff

        // borderWidth: 1,
        // borderRadius: 25,
        borderColor: '#ddd',
        height: 45,
        flex: 1,
        fontSize: 16,
        marginRight: 5,
        backgroundColor: '#f9f9f9',
    },
    orText: {
        fontSize: 16,
        color: '#666',
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
        backgroundColor: '#f9f9f9',
        marginLeft: 10,
        marginRight: 10,
    },
    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#ff5a5f',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        marginBottom: 15,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotPasswordText: {
        fontSize: 16,
        color: '#666',
        marginTop: 17,
        marginBottom: 53,
        textAlign: 'center',
    },
    forgotPasswordLink: {
        color: '#A63FA3',
        fontWeight: 'bold',
    },
    innerScrollContainer: {
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
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 10,
        backgroundColor: '#f9f9f9',
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
    const { loginUser } = useUser();

    const updateUserData = useCallback(
        (user: User) => {
            loginUser(user);
        },
        [loginUser]
    );

    const apolloClient = useApolloClient();
    const validateEmailPassword = useCallback((values: FormValues) => {
        const errors: FormValues = initialFormValues;

        errors.email = !isEmail(values.email)
            ? `${values.email} is not a valid email.`
            : '';

        errors.password = validatePassword(values.password);

        const noErrors = Object.values(errors).every((value) => value === '');
        return noErrors ? {} : errors;
    }, []);

    return (
        <SafeAreaView style={styles.outerContainer}>
            <ScrollView style={styles.innerScrollContainer}>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={async (values): Promise<void> => {
                        const result = await apolloClient.query({
                            query: LOGIN_USER_QUERY,
                            variables: {
                                email: values.email,
                                password: values.password,
                            },
                        });
                        updateUserData(result.data as User);
                        navigation.navigate('Matching');
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
                    }: {
                        errors: Partial<FormValues>;
                        values: FormValues;
                        handleChange: unknown;
                        handleBlur: unknown;
                        handleSubmit: unknown;
                    }) => (
                        <View style={styles.container}>
                            <LoginIllustration />
                            <Text style={styles.title}>Get Started</Text>
                            <Text style={styles.subtitle}>
                                by creating a free account.
                            </Text>

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
                                        onBlur={handleBlur('password')}
                                        onChangeText={handleChange('password')}
                                    />
                                </View>
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.password}
                            </Text>

                            <Text style={styles.forgotPasswordText}>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.forgotPasswordLink}>
                                        Forgot password?
                                    </Text>
                                </TouchableOpacity>
                            </Text>

                            <View style={styles.orContainer}>
                                <HorizontalLine />
                                <Text style={styles.orText}>
                                    or log in with
                                </Text>
                                <HorizontalLine />
                            </View>

                            <View style={styles.socialContainer}>
                                <TouchableOpacity style={styles.socialButton}>
                                    <FontAwesome
                                        name="facebook"
                                        size={24}
                                        color="#4267B2"
                                    />
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.socialButton}>
                                    <GoogleLogo />
                                </TouchableOpacity>
                            </View>

                            <PrimaryGradientButton
                                style={styles.topButton}
                                title="Login"
                                onPress={handleSubmit}
                            />
                        </View>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
