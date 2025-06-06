import { useState } from 'react';
import axios from 'axios';
import * as turf from '@turf/turf';

import { useAsync } from './useAsync';

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface NominatimResponse {
    lat: string;
    lon: string;
}

const getCoordinates = async (address: string): Promise<Coordinates> => {
    // Use Nominatim for geocoding
    const response = await axios.get<NominatimResponse[]>(
        'https://nominatim.openstreetmap.org/search',
        {
            params: {
                q: address,
                format: 'json',
            },
        }
    );

    if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return {
            latitude: Number.parseFloat(lat),
            longitude: Number.parseFloat(lon),
        };
    }

    throw new Error('Unable to geocode address using Nominatim');
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

    useAsync(async () => {
        try {
            const coords2 = await getCoordinates(address2);

            const from = turf.point([location1.longitude, location1.latitude]);
            const to = turf.point([coords2.longitude, coords2.latitude]);

            const calculatedDistance = turf.distance(from, to, {
                units: 'kilometers',
            });
            setDistance(calculatedDistance);
        } catch {
            setError(
                'Failed to calculate distance. Please check the addresses and try again.'
            );
        }
    }, [location1, address2]);

    return { distance, error };
};
