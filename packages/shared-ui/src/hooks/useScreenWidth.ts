import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';

export function useScreenWidth(defaultWidth = 1920) {
    // start with fallback until we know the real value
    const [width, setWidth] = useState(defaultWidth);

    useEffect(() => {
        // @ts-expect-error width
        const onChange = ({ window: { width: innerWidth } }) =>
            setWidth(innerWidth);
        // measure once immediately
        setWidth(Dimensions.get('window').width);
        Dimensions.addEventListener('change', onChange);
        // @ts-expect-error listener
        return () => Dimensions.removeEventListener('change', onChange);
    }, []);

    return width;
}
