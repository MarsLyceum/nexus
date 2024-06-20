import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
};

export const useCurrentLocation = () => {
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    }>({
        latitude: 0,
        longitude: 0,
    });
    const [error, setError] = useState<string | undefined>();

    const getCurrentLocation = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            setError('Location permission denied');
            return;
        }

        try {
            const { coords } = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const { latitude, longitude } = coords;
            setLocation({ latitude, longitude });
        } catch (error_) {
            if (error_ instanceof Error) {
                setError(error_.message);
            } else {
                setError('An unknown error occurred');
            }
        }
    };

    useEffect(() => {
        // eslint-disable-next-line no-void
        void getCurrentLocation();
    }, []);

    return { location, error, refreshLocation: getCurrentLocation };
};
