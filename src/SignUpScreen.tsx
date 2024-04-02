import {
    Text,
    View,
    TextInput,
    Button,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import React, { useCallback, useEffect } from 'react';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { useApolloClient } from '@apollo/client';

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

export function SignUpScreen({ navigation }) {
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

    const signUpWithGoogle = useCallback(async () => {
        GoogleSignin.configure({
            scopes: ['https://www.googleapis.com/auth/drive.readonly'], // what API you want to access on behalf of the user, default is email and profile
            webClientId: '<FROM DEVELOPER CONSOLE>', // client ID of type WEB for your server. Required to get the idToken on the user object, and for offline access.
            offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
            hostedDomain: '', // specifies a hosted domain restriction
            forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
            accountName: '', // [Android] specifies an account name on the device that should be used
            iosClientId: '<FROM DEVELOPER CONSOLE>', // [iOS] if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
            googleServicePlistPath: '', // [iOS] if you renamed your GoogleService-Info file, new name here, e.g. GoogleService-Info-Staging
            openIdRealm: '', // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
            profileImageSize: 120, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
        });
    }, []);

    return (
        <SafeAreaView style={formStyles.outerContainer}>
            <ScrollView style={formStyles.container}>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={async (values) => {
                        console.log('submitting...');
                        // TODO: store token in Redux and use it on other pages
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
