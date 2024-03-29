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
import React, { useCallback, useState } from 'react';
import { NavigationProp } from '@react-navigation/core';
import { FontAwesome } from '@expo/vector-icons';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';

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
                    onSubmit={(values) => {
                        console.log('submitting...');
                        const result = apolloClient.query({
                            query: LOGIN_USER_QUERY,
                            variables: {
                                email: values.email,
                                password: values.password,
                            },
                        });
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
                            <Text
                                style={{
                                    textAlign: 'center',
                                    marginTop: 20,
                                    marginBottom: 20,
                                }}
                            >
                                OR
                            </Text>
                            <View style={formStyles.fullWidth}>
                                <View style={formStyles.buttonContainerSmall}>
                                    <FontAwesome.Button
                                        name="google"
                                        backgroundColor="#4385f5"
                                    >
                                        Sign in with Google
                                    </FontAwesome.Button>
                                </View>
                                <View style={formStyles.buttonContainerSmall}>
                                    <FontAwesome.Button
                                        name="facebook"
                                        backgroundColor="#3b5998"
                                    >
                                        Sign in with Facebook
                                    </FontAwesome.Button>
                                </View>
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
                        </>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
