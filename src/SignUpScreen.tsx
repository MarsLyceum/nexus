import {
    Text,
    View,
    TextInput,
    Button,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import React, { useCallback } from 'react';
import { NavigationProp } from '@react-navigation/core';
import { FontAwesome } from '@expo/vector-icons';
import { Formik } from 'formik';
import { isEmail } from 'validator';

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
}: {
    navigation: NavigationProp<Record<string, unknown>>;
}) {
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

        return errors;
    }, []);

    return (
        <SafeAreaView style={formStyles.outerContainer}>
            <ScrollView style={formStyles.container}>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={(values) => console.log(values)}
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
                                        Sign up with Google
                                    </FontAwesome.Button>
                                </View>
                                <View style={formStyles.buttonContainerSmall}>
                                    <FontAwesome.Button
                                        name="facebook"
                                        backgroundColor="#3b5998"
                                    >
                                        Sign up with Facebook
                                    </FontAwesome.Button>
                                </View>
                            </View>
                        </>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
