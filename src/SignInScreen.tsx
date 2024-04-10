import {
    Text,
    View,
    TextInput,
    Button,
    Linking,
    Pressable,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import React, { useCallback } from 'react';
import { NavigationProp } from '@react-navigation/core';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';
import { useDispatch } from 'react-redux';

import { User } from './types';
import { setUser } from './redux';
import { LOGIN_USER_QUERY } from './queries';
import { validatePassword } from './utils';
import { formStyles } from './styles';

type FormValues = { email: string; password: string };
const initialFormValues = { email: '', password: '' };

export function SignInScreen({
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
        <SafeAreaView style={formStyles.outerContainer}>
            <ScrollView style={formStyles.container}>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={async (values) => {
                        console.log('submitting...');
                        // TODO: store token in Redux and use it on other pages
                        const result = await apolloClient.query({
                            query: LOGIN_USER_QUERY,
                            variables: {
                                email: values.email,
                                password: values.password,
                            },
                        });
                        updateUserData(result.data as User);
                        console.log('result:', result);
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
                        <>
                            <Text>Email</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="example@gmail.com"
                                    value={values.email}
                                    onBlur={handleBlur('email')}
                                    onChangeText={handleChange('email')}
                                />
                            </View>
                            <Text style={{ color: 'red' }}>{errors.email}</Text>
                            <Text>Password</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    secureTextEntry
                                    value={values.password}
                                    placeholder="At least 8 characters"
                                    onBlur={handleBlur('password')}
                                    onChangeText={handleChange('password')}
                                />
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.password}
                            </Text>

                            <View style={formStyles.buttonContainerSmall}>
                                <Pressable
                                    onPress={() =>
                                        Linking.openURL('https://example.com')
                                    }
                                >
                                    {({ pressed }) => (
                                        <Text
                                            style={{
                                                textDecorationLine: 'underline',
                                                color: pressed ? 'red' : 'blue',
                                            }}
                                        >
                                            Forgot password?
                                        </Text>
                                    )}
                                </Pressable>
                            </View>

                            <View
                                style={
                                    (formStyles.fullWidth,
                                    {
                                        marginTop: 20,
                                    })
                                }
                            >
                                <Button
                                    title="Sign in"
                                    onPress={handleSubmit}
                                />
                            </View>
                            <Text>Don't have an account?</Text>
                            <Pressable
                                onPress={() => navigation.navigate('SignUp')}
                            >
                                {({ pressed }) => (
                                    <Text
                                        style={{
                                            textDecorationLine: 'underline',
                                            color: pressed ? 'red' : 'blue',
                                        }}
                                    >
                                        Sign up
                                    </Text>
                                )}
                            </Pressable>
                            <Pressable
                                onPress={() => navigation.navigate('Setup')}
                            >
                                {({ pressed }) => (
                                    <Text
                                        style={{
                                            textDecorationLine: 'underline',
                                            color: pressed ? 'red' : 'blue',
                                        }}
                                    >
                                        Setup
                                    </Text>
                                )}
                            </Pressable>
                        </>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
