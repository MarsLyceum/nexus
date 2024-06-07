import {
    Text,
    View,
    TextInput,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import React, { useCallback, useEffect } from 'react';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { FontAwesome } from '@expo/vector-icons';
import { SignUpIllustration, GoogleLogo } from './images';

import { User } from './types';
import { setUser } from './redux';

import { REGISTER_USER_MUTATION } from './queries';
import { validatePassword } from './utils';
import { PrimaryGradientButton } from './PrimaryGradientButton';

type FormValues = {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    age: string;
};
const initialFormValues = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '18',
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
        paddingTop: 20,
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
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 20,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    orText: {
        fontSize: 16,
        color: '#666',
        marginVertical: 15,
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '40%',
        marginBottom: 20,
    },
    socialButton: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
        backgroundColor: '#f9f9f9',
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
    },
    loginLink: {
        color: '#ff5a5f',
        fontWeight: 'bold',
    },
    innerScrollContainer: {
        width: '100%',
        flexGrow: 1,
    },
});

export function SignUpScreen({
    navigation,
}: Readonly<{
    navigation: NavigationProp<Record<string, unknown>>;
}>) {
    const dispatch = useDispatch();

    const updateUserData = useCallback(
        (user: User) => {
            dispatch(setUser(user));
        },
        [dispatch]
    );

    useEffect(() => {}, []);
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

        const ageInt = Number.parseInt(values.age, 10);
        errors.age =
            ageInt > 18 || ageInt === 18
                ? ''
                : 'You must be at least 18 to use the app';

        const noErrors = Object.values(errors).every((value) => value === '');
        return noErrors ? {} : errors;
    }, []);

    return (
        <SafeAreaView style={styles.outerContainer}>
            <ScrollView style={styles.innerScrollContainer}>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={async (values): Promise<void> => {
                        const result = await apolloClient.mutate({
                            mutation: REGISTER_USER_MUTATION,
                            variables: {
                                email: values.email,
                                password: values.password,
                                firstName: values.firstName,
                                lastName: values.lastName,
                                age: Number.parseInt(values.age, 10),
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
                        handleChange: any;
                        handleBlur: any;
                        handleSubmit: any;
                    }) => (
                        <View style={styles.container}>
                            <SignUpIllustration />
                            <Text style={styles.title}>Get Started</Text>
                            <Text style={styles.subtitle}>
                                by creating a free account.
                            </Text>

                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="Name"
                                    style={styles.input}
                                    onBlur={handleBlur('firstName')}
                                    onChangeText={handleChange('firstName')}
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="Enter your email"
                                    style={styles.input}
                                    keyboardType="email-address"
                                    value={values.email}
                                    onBlur={handleBlur('email')}
                                    onChangeText={handleChange('email')}
                                />
                                <Text style={{ color: 'red' }}>
                                    {errors.email}
                                </Text>
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="Phone Number"
                                    style={styles.input}
                                    keyboardType="phone-pad"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    placeholder="Password"
                                    style={styles.input}
                                    secureTextEntry
                                    onBlur={handleBlur('password')}
                                    onChangeText={handleChange('password')}
                                />
                                <Text style={{ color: 'red' }}>
                                    {errors.password}
                                </Text>
                            </View>

                            <Text style={styles.orText}>or sign up with</Text>

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
                                title="Create an account"
                                onPress={() => navigation.navigate('SignUp')}
                            />

                            <Text style={styles.loginText}>
                                Already a member?{' '}
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    <Text style={styles.loginLink}>Log In</Text>
                                </TouchableOpacity>
                            </Text>
                        </View>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
