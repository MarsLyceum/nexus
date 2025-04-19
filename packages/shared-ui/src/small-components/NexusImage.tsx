// NexusImage.tsx
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
// Next.js Image import – no longer used in Next environments.
// import NextImage from 'next/image';
// Expo Image import – used for React Native.
import {
    Image as ExpoImage,
    ImageContentFit,
    ImageContentPosition,
} from 'expo-image';

import { detectEnvironment, Environment } from '../utils';

// Define the prop types for NexusImage.
// The API mimics Expo Image: it accepts a `source` (string or {uri: string}),
// an `alt` prop, styling with dynamic sizing, and now a `contentFit` prop.
export type NexusImageProps = {
    source: string | { uri: string };
    alt: string;
    style?: React.CSSProperties;
    width?: number | string;
    height?: number | string;
    contentFit?: ImageContentFit; // e.g., 'contain', 'cover', etc.
    contentPosition?: ImageContentPosition;
    unoptimized?: boolean;
    // Allow any additional props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
};

/**
 * useContainerDimensions
 *
 * A helper hook that measures a container's dimensions using its ref.
 * (For production, consider using a ResizeObserver so that the measurement updates on window/container resize.)
 */
const useContainerDimensions = (ref: React.RefObject<HTMLDivElement>) => {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    useLayoutEffect(() => {
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            setDimensions({ width: rect.width, height: rect.height });
        }
    }, [ref]);
    return dimensions;
};

function contentPositionToCss(pos?: ImageContentPosition): string | undefined {
    // 1) string shorthand (e.g. 'left center')
    if (typeof pos === 'string') {
        return pos;
    }
    // 2) undefined or null
    if (!pos) {
        return undefined;
    }

    // 3) horizontal: check 'left' or 'right'
    let horiz = '50%';
    if ('left' in pos && typeof pos.left === 'number') {
        horiz = `${pos.left * 100}%`;
    } else if ('right' in pos && typeof pos.right === 'number') {
        horiz = `${(1 - pos.right) * 100}%`;
    }

    // 4) vertical: check 'top' or 'bottom'
    let vert = '50%';
    if ('top' in pos && typeof pos.top === 'number') {
        vert = `${pos.top * 100}%`;
    } else if ('bottom' in pos && typeof pos.bottom === 'number') {
        vert = `${(1 - pos.bottom) * 100}%`;
    }

    return `${horiz} ${vert}`;
}

/**
 * NexusImage
 *
 * - Uses detectEnvironment() to determine if the current environment is Next.js or React Native.
 * - In React Native (mobile or web via Expo), it renders ExpoImage with the same API as Expo.
 *   It now explicitly applies the width and height props to the style and passes the `contentFit` prop.
 * - In Next.js, if the width or height props (or corresponding style values) are given as percentages,
 *   it wraps a standard img tag in a container, measures its dimensions, and passes the computed numeric width/height.
 * - Otherwise, if the dimensions are static (numeric or pixel strings), it extracts the numeric values
 *   and passes them directly to the standard img tag.
 * - It now supports a `contentFit` prop to control the image's object-fit style.
 */
export const NexusImage = (props: NexusImageProps) => {
    const {
        source,
        alt,
        style = {},
        width,
        height,
        contentFit,
        contentPosition,
        unoptimized,
        ...rest
    } = props;
    const env: Environment = detectEnvironment();

    const containerRef = useRef<HTMLDivElement>(null);
    const { width: containerWidth, height: containerHeight } =
        useContainerDimensions(containerRef);

    const originalUri = typeof source === 'string' ? source : source.uri;
    const fallbackUri = `https://images.weserv.nl/?url=${encodeURIComponent(originalUri)}`;

    const [imageUri, setImageUri] = useState(originalUri);
    const [didFallback, setDidFallback] = useState(false);

    const handleError = () => {
        if (!didFallback) {
            console.warn(
                `[NexusImage] failed to load ${originalUri}, falling back to proxy ${fallbackUri}`
            );
            setImageUri(fallbackUri);
            setDidFallback(true);
            // TODO: wire this into your analytics/logging system
        }
    };

    useEffect(() => {
        let stillMounted = true;
        setDidFallback(false); // reset if originalUri ever changes
        setImageUri(originalUri); // start fresh

        void (async () => {
            try {
                const res = await fetch(originalUri, { method: 'HEAD' });
                if (stillMounted && !res.ok && !didFallback) {
                    console.warn(
                        `[NexusImage] HEAD ${res.status} for ${originalUri}, falling back…`
                    );
                    setImageUri(fallbackUri);
                    setDidFallback(true);
                }
            } catch (error) {
                if (stillMounted && !didFallback) {
                    console.warn(
                        `[NexusImage] HEAD error for ${originalUri}:`,
                        error
                    );
                    setImageUri(fallbackUri);
                    setDidFallback(true);
                }
            }
        })();

        return () => {
            stillMounted = false;
        };
    }, [originalUri]);

    // --- React Native: use Expo Image ---
    if (env === 'react-native-mobile') {
        // Expo Image requires the source to be an object with a `uri` property.
        const expoSource = { uri: imageUri };
        // Merge provided width and height into the style for proper sizing in Expo.
        const expoStyle: React.CSSProperties = { ...style };
        if (width) expoStyle.width = width;
        if (height) expoStyle.height = height;
        return (
            <ExpoImage
                source={expoSource}
                // @ts-expect-error style
                style={expoStyle}
                accessibilityLabel={alt}
                contentFit={contentFit} // Pass contentFit directly
                onError={handleError}
                contentPosition={contentPosition}
                {...rest}
            />
        );
    }

    // --- Next.js: use standard img tag instead of Next Image ---
    // Determine if width or height is dynamic (i.e. percentage-based)
    const isDynamicWidth = typeof width === 'string' && width.endsWith('%');
    const isDynamicHeight = typeof height === 'string' && height.endsWith('%');

    // Helper function to extract numeric size from a prop or style (if provided as a pixel string).
    const getNumericSize = (
        propSize: number | string | undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        styleSize: any
        // eslint-disable-next-line unicorn/consistent-function-scoping
    ): number | undefined => {
        if (typeof propSize === 'number') return propSize;
        if (typeof propSize === 'string' && propSize.endsWith('px'))
            return Number.parseFloat(propSize);
        if (typeof styleSize === 'string' && styleSize.endsWith('px'))
            return Number.parseFloat(styleSize);
        return undefined;
    };

    // If dynamic sizes are used, wrap the image in a container and measure its size.
    if (isDynamicWidth || isDynamicHeight) {
        // Create a container style by merging the passed style with required properties.
        const containerStyle: React.CSSProperties = {
            position: 'relative',
            // Use provided width/height or fallback to style values.
            width: width || style.width || '100%',
            height: height || style.height || '100%',
            ...style,
        };

        // Until the container dimensions are measured, render an empty container.
        if (!containerWidth || !containerHeight) {
            return <div ref={containerRef} style={containerStyle} />;
        }

        return (
            <div ref={containerRef} style={containerStyle}>
                <img
                    src={imageUri}
                    alt={alt}
                    width={containerWidth}
                    height={containerHeight}
                    style={{
                        objectFit: contentFit ?? 'contain',
                        objectPosition:
                            contentPositionToCss(contentPosition) ??
                            'center center',
                        width: '100%',
                        height: '100%',
                    }}
                    onError={handleError}
                    {...rest}
                />
            </div>
        );
    }

    // For static dimensions, extract numeric width/height.
    const numericWidth = getNumericSize(width, style.width) || 300; // Fallback width.
    const numericHeight = getNumericSize(height, style.height) || 200; // Fallback height.
    return (
        <img
            src={imageUri}
            alt={alt}
            width={numericWidth}
            height={numericHeight}
            style={{
                ...style,
                objectFit: contentFit ?? style.objectFit,
                objectPosition:
                    contentPositionToCss(contentPosition) ?? 'center center',
            }}
            onError={handleError}
            {...rest}
        />
    );
};
