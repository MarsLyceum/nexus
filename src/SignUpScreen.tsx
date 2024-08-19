import {
    Text,
    View,
    TextInput,
    SafeAreaView,
    ScrollView,
    Pressable,
    StyleSheet,
    GestureResponderEvent,
} from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import React, { useCallback } from 'react';
import Auth0 from 'react-native-auth0';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { FontAwesome } from '@expo/vector-icons';
import { useApolloClient } from '@apollo/client';

import { REGISTER_USER_MUTATION } from './queries';
import { SignUpIllustration, HorizontalLine } from './images';
import { GoogleLogo, User as UserIcon, Email, Phone, Lock } from './icons';
import { User } from './types';
import { loginUser, useAppDispatch } from './redux';

import {
    validatePassword,
    AUTH0_DOMAIN,
    AUTH0_CLIENT_ID,
    AUTH0_AUDIENCE,
} from './utils';
import { PrimaryGradientButton } from './PrimaryGradientButton';

const auth0 = new Auth0({
    domain: AUTH0_DOMAIN ?? '',
    clientId: AUTH0_CLIENT_ID ?? '',
});

type DecodedToken = JwtPayload & {
    email: string;
};

type FormValues = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
};
const initialFormValues = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
};

const styles = StyleSheet.create({
    topButton: {
        marginTop: 38,
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
    loginText: {
        fontSize: 16,
        color: '#666',
        marginTop: 30,
        marginBottom: 34,
        textAlign: 'center',
    },
    loginLink: {
        color: '#ff5a5f',
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

export function SignUpScreen({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) {
    const dispatch = useAppDispatch();

    const updateUserData = useCallback(
        (user: User) => {
            dispatch(loginUser(user));
        },
        [dispatch]
    );

    const apolloClient = useApolloClient();

    const validateEmailPassword = useCallback((values: FormValues) => {
        const errors: FormValues = initialFormValues;

        errors.email = isEmail(values.email)
            ? ''
            : `${values.email} is not a valid email.`;
        errors.password = validatePassword(values.password);
        errors.firstName =
            values.firstName.length > 0 ? '' : 'Please provide your first name';
        errors.lastName =
            values.lastName.length > 0 ? '' : 'Please provide your last name';

        const noErrors = Object.values(errors).every((value) => value === '');
        return noErrors ? {} : errors;
    }, []);

    const handleSignup = async (values: FormValues) => {
        try {
            await auth0.auth.createUser({
                email: values.email,
                password: values.password,
                connection: 'Username-Password-Authentication',
                user_metadata: {},
            });

            // Log the user in
            const credentials = await auth0.auth.passwordRealm({
                username: values.email,
                password: values.password,
                realm: 'Username-Password-Authentication',
                audience: AUTH0_AUDIENCE,
                scope: 'openid profile email',
            });

            // Decode the ID token to get user information
            const decodedToken = jwtDecode<DecodedToken>(credentials.idToken);

            const auth0Data = {
                email: decodedToken.email,
                token: credentials.idToken,
            };

            // const result = await apolloClient.mutate({
            //     mutation: REGISTER_USER_MUTATION,
            //     variables: {
            //         email: values.email,
            //         firstName: values.firstName,
            //         lastName: values.lastName,
            //         phoneNumber: values.phoneNumber,
            //     },
            // });

            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const user: User = {
                // ...result.data,
                token: auth0Data.token,
            };

            // updateUserData(user);

            navigation.navigate('Matching');
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                // eslint-disable-next-line no-alert
                alert(`Signup failed: ${error.message}`);
            } else {
                // eslint-disable-next-line no-alert
                alert('Signup failed: An unknown error occurred');
            }
        }
    };

    return (
        <SafeAreaView style={styles.outerContainer}>
            <ScrollView style={styles.innerScrollContainer}>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={handleSignup}
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
                            <SignUpIllustration />
                            <Text style={styles.title}>Get Started</Text>
                            <Text style={styles.subtitle}>
                                by creating a free account.
                            </Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <UserIcon style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="First Name"
                                        style={styles.input}
                                        selectionColor="#ddd"
                                        onBlur={handleBlur('firstName')}
                                        onChangeText={handleChange('firstName')}
                                    />
                                </View>
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.firstName}
                            </Text>
                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <UserIcon style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Last Name"
                                        style={styles.input}
                                        onBlur={handleBlur('lastName')}
                                        onChangeText={handleChange('lastName')}
                                    />
                                </View>
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.lastName}
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
                                    <Phone style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Phone Number"
                                        style={styles.input}
                                        keyboardType="phone-pad"
                                    />
                                </View>
                            </View>
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

                            <View style={styles.orContainer}>
                                <HorizontalLine />
                                <Text style={styles.orText}>
                                    or sign up with
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
                                title="Create an account"
                                onPress={
                                    handleSubmit as unknown as (
                                        event: GestureResponderEvent
                                    ) => void
                                }
                            />

                            <Text style={styles.loginText}>
                                Already a member?{' '}
                                <Pressable
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.loginLink}>Log In</Text>
                                </Pressable>
                            </Text>
                        </View>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
