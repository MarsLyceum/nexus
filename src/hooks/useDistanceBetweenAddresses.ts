import { useState, useEffect } from 'react';
import axios from 'axios';
import * as turf from '@turf/turf';

const GEOCODING_API_KEY = 'YOUR_GOOGLE_API_KEY'; // Replace with your Google API key
const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface GeocodingResponse {
    results: {
        geometry: {
            location: {
                lat: number;
                lng: number;
            };
        };
    }[];
}

const getCoordinates = async (address: string): Promise<Coordinates> => {
    const response = await axios.get<GeocodingResponse>(GEOCODING_API_URL, {
        params: {
            address,
            key: GEOCODING_API_KEY,
        },
    });

    const { lat, lng } = response.data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
};

export const useDistanceBetweenAddresses = (
    location1: {
        latitude: number;
        longitude: number;
    },
    address2: string
) => {
    const [distance, setDistance] = useState<number | undefined>();
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
        // eslint-disable-next-line no-void
        void (async () => {
            try {
                const coords2 = await getCoordinates(address2);
                alert(JSON.stringify(coords2));

                const from = turf.point([
                    location1.longitude,
                    location1.latitude,
                ]);
                const to = turf.point([coords2.longitude, coords2.latitude]);

                const calculatedDistance = turf.distance(from, to, {
                    units: 'kilometers',
                });
                alert(calculatedDistance);
                setDistance(calculatedDistance);
            } catch {
                setError(
                    'Failed to calculate distance. Please check the addresses and try again.'
                );
            }
        })();
    }, []);

    return { distance, error };
};
