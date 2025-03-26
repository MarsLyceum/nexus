import {
    Text,
    View,
    TextInput,
    SafeAreaView,
    ScrollView,
    Pressable,
    StyleSheet,
    GestureResponderEvent,
    Platform,
} from 'react-native';
import React, { useCallback } from 'react';
import { Formik } from 'formik';
import { isEmail } from 'validator';
import { FontAwesome } from '@expo/vector-icons';
import { useApolloClient } from '@apollo/client';

import { REGISTER_USER_MUTATION } from '@shared-ui/queries';
import { HorizontalLine } from '@shared-ui/images';
import { GoogleLogo, UserIcon, Email, Phone, Lock } from '@shared-ui/icons';
import { User } from '@shared-ui/types';
import { loginUser, useAppDispatch } from '@shared-ui/redux';
import { validatePassword } from '@shared-ui/utils';
import { PrimaryGradientButton } from '@shared-ui/buttons';
import { COLORS } from '@shared-ui/constants';
import { useRouter } from 'solito/router';

const isWeb = Platform.OS === 'web';

type FormValues = {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
};

const initialFormValues: FormValues = {
    email: '',
    username: '',
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
        backgroundColor: COLORS.AppBackground,
    },
    container: {
        paddingHorizontal: 20,
        backgroundColor: COLORS.PrimaryBackground,
        alignItems: 'center',
        paddingBottom: 40, // extra bottom padding to ensure scrollability
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
        marginTop: 20,
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
        marginBottom: 15,
        height: 50,
        alignItems: 'center',
    },
    input: {
        height: 45,
        flex: 1,
        fontSize: 16,
        marginRight: 5,
        backgroundColor: COLORS.TextInput,
        color: COLORS.White,
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
        marginHorizontal: 10,
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
    loginText: {
        fontSize: 16,
        color: COLORS.InactiveText,
        marginTop: 30,
        marginBottom: 34,
        textAlign: 'center',
    },
    loginLink: {
        color: COLORS.Link,
        fontWeight: 'bold',
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
        borderColor: COLORS.Secondary,
        borderWidth: 1,
        borderRadius: 25,
        paddingHorizontal: 10,
        backgroundColor: COLORS.TextInput,
        height: 50,
        flex: 1,
        fontSize: 16,
    },
    scrollSection: isWeb
        ? {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              overflowY: 'auto',
          }
        : { flex: 1 },
});

export function SignUpScreen(): JSX.Element {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const apolloClient = useApolloClient();

    const updateUserData = useCallback(
        (user: User) => {
            dispatch(loginUser(user));
        },
        [dispatch]
    );

    const validateEmailPassword = useCallback((values: FormValues) => {
        const errors: Partial<FormValues> = {};

        errors.email = isEmail(values.email)
            ? ''
            : `${values.email} is not a valid email.`;
        errors.username =
            values.username.length > 0 ? '' : 'Please provide a username';
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
            const result = await apolloClient.mutate({
                mutation: REGISTER_USER_MUTATION,
                variables: {
                    email: values.email,
                    password: values.password,
                    username: values.username,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phoneNumber: values.phoneNumber,
                },
            });
            const user: User = result.data.registerUser;
            updateUserData(user);
            router.push('/app');
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                alert(`Signup failed: ${error.message}`);
            } else {
                alert('Signup failed: An unknown error occurred');
            }
        }
    };

    return (
        <SafeAreaView style={styles.outerContainer}>
            <ScrollView contentContainerStyle={styles.scrollSection}>
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
                            <Text style={styles.title}>Get Started</Text>
                            <Text style={styles.subtitle}>
                                by creating a free account.
                            </Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <UserIcon style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="First Name"
                                        placeholderTextColor={COLORS.White}
                                        style={styles.input}
                                        selectionColor={COLORS.Secondary}
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
                                        placeholderTextColor={COLORS.White}
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
                                    <UserIcon style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Username"
                                        placeholderTextColor={COLORS.White}
                                        style={styles.input}
                                        onBlur={handleBlur('username')}
                                        onChangeText={handleChange('username')}
                                    />
                                </View>
                            </View>
                            <Text style={{ color: 'red' }}>
                                {errors.username}
                            </Text>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <Email style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Enter your email"
                                        placeholderTextColor={COLORS.White}
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
                                        placeholderTextColor={COLORS.White}
                                        style={styles.input}
                                        keyboardType="phone-pad"
                                        value={values.phoneNumber}
                                        onBlur={handleBlur('phoneNumber')}
                                        onChangeText={handleChange(
                                            'phoneNumber'
                                        )}
                                    />
                                </View>
                            </View>

                            <View style={styles.inputContainer}>
                                <View style={styles.inputWrapper}>
                                    <Lock style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Password"
                                        placeholderTextColor={COLORS.White}
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
                                    onPress={() => router.push('/login')}
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
