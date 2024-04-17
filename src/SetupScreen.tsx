import React, { Component, useCallback, useState } from 'react';
import {
    AppRegistry,
    StyleSheet,
    Text,
    View,
    TextInput,
    Button,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import Slick from 'react-native-slick';
import { NavigationProp } from '@react-navigation/core';
import { Formik } from 'formik';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { formStyles } from './styles';

type FormValues = {
    interests: string;
    description: string;
    image: string;
    gender: string;
    age: string;
    location: string;
};

const initialFormValues: FormValues = {
    interests: '',
    description: '',
    image: '',
    gender: '',
    age: '',
    location: '',
};

export function SetupScreen({
    navigation,
}: {
    navigation: NavigationProp<Record<string, unknown>>;
}) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleImagePicker = async () => {
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to select an image.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.uri);
        }
    };

    const handleSubmit = useCallback((values: FormValues) => {
        console.log(values);
        // Handle form submission
    }, []);

    return (
        <SafeAreaView style={formStyles.outerContainer}>
            <ScrollView style={formStyles.container}>
                <Slick style={formStyles.slickWrapper} showsButtons>
                    <View style={formStyles}
                </Slick>
                <Text style={formStyles.headerTitle}>Setup your Profile</Text>
                <Formik
                    initialValues={initialFormValues}
                    onSubmit={handleSubmit}
                    validateOnChange={false}
                    validateOnBlur={false}
                >
                    {({ handleChange, handleBlur, handleSubmit, values }) => (
                        <>
                            <Text>Interests</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Search interests"
                                    onBlur={handleBlur('interests')}
                                    onChangeText={handleChange('interests')}
                                />
                            </View>
                            <View style={formStyles.wordCloudContainer}>
                                {/* todo: Render word cloud based on selected interests */}
                            </View>

                            <Text>Description</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Write a brief description about yourself"
                                    onBlur={handleBlur('description')}
                                    onChangeText={handleChange('description')}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <Text>Upload Image</Text>
                            <TouchableOpacity
                                style={formStyles.imageSelector}
                                onPress={handleImagePicker}
                            >
                                {selectedImage ? (
                                    <Image
                                        source={{ uri: selectedImage }}
                                        style={formStyles.selectedImage}
                                    />
                                ) : (
                                    <FontAwesome
                                        name="camera"
                                        size={24}
                                        color="gray"
                                    />
                                )}
                            </TouchableOpacity>

                            <Text>Gender</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Enter your gender"
                                    onBlur={handleBlur('gender')}
                                    onChangeText={handleChange('gender')}
                                />
                            </View>

                            <Text>Age</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Enter your age"
                                    onBlur={handleBlur('age')}
                                    onChangeText={handleChange('age')}
                                    keyboardType="numeric"
                                />
                            </View>

                            <Text>Location</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Enter your location"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Height</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Enter your height"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Education</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Describe your education (high school, college, etc.)"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Drinker? Smoker? 420?</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Enter it here"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Politics</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Describe your political leanings, if any"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Religion</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Describe your religious beliefs, if any"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Sign</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Enter your sign"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Languages</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="Enter any languages you speak"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <Text>Favorite Artists</Text>
                            <View style={formStyles.textInputContainer}>
                                <TextInput
                                    placeholder="List any of your favorite artists here"
                                    onBlur={handleBlur('location')}
                                    onChangeText={handleChange('location')}
                                />
                            </View>

                            <View style={formStyles.buttonContainer}>
                                <Button title="Save" onPress={handleSubmit} />
                            </View>
                        </>
                    )}
                </Formik>
            </ScrollView>
        </SafeAreaView>
    );
}
