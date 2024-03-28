import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Button,
    Linking,
    Pressable,
    SafeAreaView,
} from 'react-native';
import { useState, useCallback } from 'react';
import { NavigationProp } from '@react-navigation/core';
import { FontAwesome } from '@expo/vector-icons';
import isEmail from 'validator/lib/isEmail';

export function SignInScreen({
    navigation,
}: {
    navigation: NavigationProp<any>;
}) {
    const [email, setEmail] = useState<string | undefined>();
    const [password, setPassword] = useState<string | undefined>();
    const [emailError, setEmailError] = useState<string>('');
    const [passwordError, setPasswordError] = useState<string>('');

    const validateEmailPassword = useCallback(() => {
        if (newEmail && !isEmail(newEmail ?? '')) {
            setEmailError(`${newEmail} is not a valid email.`);
        } else {
            setEmailError();
        }
        setEmail(newEmail);
    }, [email, password]);

    return (
        <SafeAreaView style={styles.outerContainer}>
            <View style={styles.container}>
                <Text>Email</Text>
                <View style={styles.textInputContainer}>
                    <TextInput
                        placeholder="example@gmail.com"
                        value={email}
                        onChangeText={setEmail}
                    />
                </View>
                <Text style={{ color: 'red' }}>{emailError}</Text>
                <Text>Password</Text>
                <View style={styles.textInputContainer}>
                    <TextInput
                        secureTextEntry
                        placeholder="At least 8 characters"
                    />
                </View>
                <Text style={{ color: 'red' }}>{emailError}</Text>

                <View style={styles.buttonContainerSmall}>
                    <Pressable
                        onPress={() => Linking.openURL('https://example.com')}
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
                        (styles.fullWidth,
                        {
                            marginTop: 20,
                        })
                    }
                >
                    <Button title="Sign in" />
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
                <View style={styles.fullWidth}>
                    <View style={styles.buttonContainerSmall}>
                        <FontAwesome.Button
                            name="google"
                            backgroundColor="#4385f5"
                        >
                            Sign in with Google
                        </FontAwesome.Button>
                    </View>
                    <View style={styles.buttonContainerSmall}>
                        <FontAwesome.Button
                            name="facebook"
                            backgroundColor="#3b5998"
                        >
                            Sign in with Facebook
                        </FontAwesome.Button>
                    </View>
                </View>
                <Text>Don't have an account?</Text>
                <Pressable onPress={() => navigation.navigate('SignUp')}>
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
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        width: '50%',
    },
    buttonContainerSmall: {
        display: 'flex',
        marginTop: 5,
        marginBottom: 5,
    },
    textInputContainer: {
        borderLeftWidth: 1,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderRadius: 4,
        padding: 4,
        backgroundColor: '#f7fbff',
        width: '100%',
    },
    fullWidth: {
        width: '100%',
    },
    inlineView: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    btnContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'stretch',
        alignSelf: 'stretch',
        borderRadius: 10,
    },
    btnClickContain: {
        // flex: 1,
        // flexDirection: "row",
        // justifyContent: "center",
        // alignItems: "stretch",
        // alignSelf: "stretch",
        backgroundColor: '#f3f9fa',
        borderRadius: 5,
        padding: 5,
        marginTop: 5,
        marginBottom: 5,
        height: 30,
    },
});
