import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const useCurrentLocation = () => {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    }>({ latitude: 0, longitude: 0 });
    const [error, setError] = useState<string | undefined>();

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Geolocation Permission',
                        message: 'Can we access your location?',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (error_) {
                console.warn(error_);
                return false;
            }
        }
        return true; // iOS permissions are handled in the Info.plist file
    };

    const getCurrentLocation = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            setError('Location permission denied');
            return;
        }

        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({ latitude, longitude });
            },
            (err) => {
                setError(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 15_000,
                maximumAge: 10_000,
            }
        );
    };

    useEffect(() => {
        // eslint-disable-next-line no-void
        void getCurrentLocation();
    }, []);

    return { location, error, refreshLocation: getCurrentLocation };
};
