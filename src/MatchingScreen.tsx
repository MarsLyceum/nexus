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

import { HeaderButton } from './HeaderButton';
import { ArrowLeft, Setting, LocationPin } from './icons';
import { MatchUserProfile } from './types';
import { useDistanceBetweenAddresses, useCurrentLocation } from './hooks';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
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
        position: 'relative',
        width: 295,
        height: 450,
    },
    cardContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: 295,
        height: 450,
        borderRadius: 20,
    },
    distanceText: {
        color: '#FFF',
        marginLeft: 5,
    },
    distanceIcon: {
        marginTop: 2.5,
    },
    distanceLayout: {
        display: 'flex',
        flexDirection: 'row',
    },
    distanceContainer: {
        position: 'absolute',
        // top: 16,
        // left: 16,
        // backgroundColor: '#000',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        color: 'black',
        padding: 4,
        borderRadius: 4,
        elevation: 2,
        width: 70,
        height: 34,

        top: 20,
        left: 16,
    },
    info: {
        padding: 16,
        position: 'absolute',
        backgroundColor: '#000000',
        width: 295,
        height: 83,
        color: '#FFF',
        bottom: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    job: {
        fontSize: 16,
        color: '#FFF',
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
    const [user] = useState<MatchUserProfile>({
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
    const { location: currentLocation } = useCurrentLocation();
    const { distance } = useDistanceBetweenAddresses(
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
                    <HeaderButton onPress={() => navigation.goBack()}>
                        <ArrowLeft />
                    </HeaderButton>
                    <View>
                        <Text style={styles.headerTitle}>Discover</Text>
                        <Text style={styles.location}>Provo, UT</Text>
                    </View>
                    <HeaderButton onPress={() => {}}>
                        <Setting />
                    </HeaderButton>
                </View>
                <View style={styles.cardContainer}>
                    <View style={styles.card}>
                        <Image
                            source={user.gallery[0]}
                            style={styles.profileImage}
                        />
                        <View style={styles.distanceContainer}>
                            <View style={styles.distanceLayout}>
                                <View style={styles.distanceIcon}>
                                    <LocationPin />
                                </View>
                                <Text style={styles.distanceText}>
                                    {Math.round(distance ?? 0)}km
                                </Text>
                            </View>
                        </View>
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
                                <Icon
                                    name="heart"
                                    type="material"
                                    color="#FFF"
                                />
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
                </View>
                <View style={styles.footer}>
                    <Icon name="home" type="material" color="#FFF" />
                    <Icon name="group" type="material" color="#FFF" />
                    <Icon name="chat" type="material" color="#FFF" />
                    <Icon name="person" type="material" color="#FFF" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};
