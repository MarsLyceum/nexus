import React, { useState } from 'react';
import {
    SafeAreaView,
    View,
    Image,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { Button, Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';

import { MatchUserProfile } from './types';
import { useDistanceBetweenAddresses, useCurrentLocation } from './hooks';
import { Navbar } from './Navbar';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    location: {
        textAlign: 'center',
        fontSize: 16,
        color: '#A3A3A3',
        marginVertical: 8,
    },
    card: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 8,
        margin: 16,
        elevation: 4,
    },
    profileImage: {
        width: 295,
        height: 466,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    distance: {
        position: 'absolute',
        top: 16,
        left: 16,
        backgroundColor: '#FFF',
        padding: 4,
        borderRadius: 4,
        elevation: 2,
    },
    info: {
        padding: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    job: {
        fontSize: 16,
        color: '#A3A3A3',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        margin: 16,
    },
    actionButton: {
        backgroundColor: '#FFF',
        borderRadius: 50,
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainButton: {
        backgroundColor: '#FF6C6C',
        borderRadius: 50,
        width: 80,
        height: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#FF6C6C',
        paddingVertical: 12,
    },
});

export const MatchingScreen = () => {
    const navigation = useNavigation();
    const [user, setUser] = useState<MatchUserProfile>({
        id: 'unique-user-id',
        firstName: 'Caudia',
        lastName: 'Smith',
        age: 23,
        profession: 'Professional model',
        location: {
            city: 'Chicago',
            state: 'IL',
            country: 'United States',
            address: '1600 North Lake Shore Drive, Chicago, IL 60610, USA',
        },
        about: 'My name is Jessica Parker and I enjoy meeting new people and finding ways to help them have an uplifting experience. I enjoy reading.',
        interests: ['Swimming', 'Yoga', 'Music', 'Photography'],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        gallery: [
            // eslint-disable-next-line global-require, unicorn/prefer-module
            require('./images/jessica-profile-1.png'),
            // eslint-disable-next-line global-require, unicorn/prefer-module
            require('./images/jessica-profile-2.png'),
            // eslint-disable-next-line global-require, unicorn/prefer-module
            require('./images/jessica-profile-3.png'),
            // eslint-disable-next-line global-require, unicorn/prefer-module
            require('./images/jessica-profile-4.png'),
            // eslint-disable-next-line global-require, unicorn/prefer-module
            require('./images/jessica-profile-5.png'),
        ],
    });
    const {
        location: currentLocation,
        error: locationError,
        refreshLocation,
    } = useCurrentLocation();
    const { distance, error: distanceError } = useDistanceBetweenAddresses(
        currentLocation,
        user.location.address
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsHorizontalScrollIndicator={false}
                // contentContainerStyle={styles.innerScrollContainer}
            >
                <View style={styles.header}>
                    <Icon
                        name="arrow-back"
                        type="material"
                        color="#000"
                        onPress={() => navigation.goBack()}
                    />
                    <Text style={styles.headerTitle}>Discover</Text>
                    <Icon
                        name="filter-list"
                        type="material"
                        color="#000"
                        onPress={() => console.log('Filter pressed')}
                    />
                </View>
                <Text style={styles.location}>Provo, UT</Text>
                <View style={styles.card}>
                    <Image
                        source={user.gallery[0]}
                        style={styles.profileImage}
                    />
                    <Text style={styles.distance}>{distance}</Text>
                    <View style={styles.info}>
                        <Text style={styles.name}>
                            {user.firstName} {user.lastName}, {user.age}
                        </Text>
                        <Text style={styles.job}>{user.profession}</Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <Button
                        icon={
                            <Icon
                                name="thumb-down"
                                type="material"
                                color="#FF6C6C"
                            />
                        }
                        buttonStyle={styles.actionButton}
                        onPress={() => console.log('Dislike')}
                    />
                    <Button
                        icon={
                            <Icon name="heart" type="material" color="#FFF" />
                        }
                        buttonStyle={styles.mainButton}
                        onPress={() => console.log('Main action')}
                    />
                    <Button
                        icon={
                            <Icon
                                name="thumb-up"
                                type="material"
                                color="#6C6CFF"
                            />
                        }
                        buttonStyle={styles.actionButton}
                        onPress={() => console.log('Like')}
                    />
                </View>
                <Navbar />
            </ScrollView>
        </SafeAreaView>
    );
};
