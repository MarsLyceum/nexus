import {
    Text,
    View,
    TextInput,
    Button,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { NavigationProp } from '@react-navigation/core';
import React, { useCallback, useEffect } from 'react';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';
import { useDispatch } from 'react-redux';

import { User } from './types';
import { setUser } from './redux';

import { REGISTER_USER_MUTATION } from './queries';
import { validatePassword } from './utils';
import { formStyles } from './styles';

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
        <SafeAreaView style={formStyles.outerContainer}>
            <ScrollView style={formStyles.container}>
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
                                    placeholder="At least 8 characters"
                                    onBlur={handleBlur('password')}
                                    onChangeText={handleChange('password')}
                                />
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.password}
                            </Text>
                            <Text>First Name</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Jane"
                                    onBlur={handleBlur('firstName')}
                                    onChangeText={handleChange('firstName')}
                                />
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.firstName}
                            </Text>
                            <Text>Last Name</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Doe"
                                    onBlur={handleBlur('lastName')}
                                    onChangeText={handleChange('lastName')}
                                />
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.lastName}
                            </Text>
                            <Text>Age</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="42"
                                    onBlur={handleBlur('age')}
                                    onChangeText={handleChange('age')}
                                />
                            </View>
                            <Text style={{ color: 'red' }}>{errors.age}</Text>

                            <View
                                style={
                                    (formStyles.fullWidth,
                                    {
                                        marginTop: 20,
                                    })
                                }
                            >
                                <Button
                                    title="Sign up"
                                    onPress={handleSubmit}
                                />
                            </View>
                        </>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
