import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Determines the MIME type from a file URI or file name.
 */
const getMimeType = (input: string): string => {
    const extension = input.split('.').pop()?.toLowerCase();
    switch (extension) {
        // Images
        case 'jpg':
        case 'jpeg': {
            return 'image/jpeg';
        }
        case 'png': {
            return 'image/png';
        }
        case 'gif': {
            return 'image/gif';
        }
        case 'webp': {
            return 'image/webp';
        }
        case 'bmp': {
            return 'image/bmp';
        }
        case 'tiff':
        case 'tif': {
            return 'image/tiff';
        }

        // Videos
        case 'mp4': {
            return 'video/mp4';
        }
        case 'mov': {
            return 'video/quicktime';
        }
        case 'wmv': {
            return 'video/x-ms-wmv';
        }
        case 'flv': {
            return 'video/x-flv';
        }
        case 'avi': {
            return 'video/x-msvideo';
        }
        case 'mkv': {
            return 'video/x-matroska';
        }
        case 'webm': {
            return 'video/webm';
        }
        case 'mpeg':
        case 'mpg': {
            return 'video/mpeg';
        }

        // Audio (optional)
        case 'mp3': {
            return 'audio/mpeg';
        }
        case 'wav': {
            return 'audio/wav';
        }
        case 'ogg': {
            return 'audio/ogg';
        }

        // Fallback
        default: {
            return 'application/octet-stream';
        }
    }
};

/**
 * Converts a base64 data URL into a File object (for web).
 */
const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Invalid data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    // eslint-disable-next-line no-plusplus
    while (n--) {
        // eslint-disable-next-line unicorn/prefer-code-point
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {
        type: mime,
        lastModified: Date.now(),
    });
};

/**
 * Custom hook to handle file (image) uploads.
 */
export const useFileUpload = () => {
    const [fileData, setFileData] = useState<string | undefined>();

    /**
     * Triggers the image picker and returns the formatted file.
     */
    const pickFile = async (): Promise<
        File | { uri: string; type: string; name: string } | undefined
    > => {
        // Request permissions
        const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
        if (status !== 'granted') {
            Alert.alert(
                'Permission required',
                'Permission to access media library is required!'
            );
            return undefined;
        }

        // Launch the image picker with cropping enabled, but no forced aspect ratio
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos', 'livePhotos'], // Updated: use an array of media types
            allowsEditing: true, // Allows cropping, but no fixed aspect ratio
            quality: 1,
            base64: Platform.OS === 'web', // Request base64 on web
        });

        // Check if the user cancelled the picker
        const canceled =
            ('canceled' in result && result.canceled) ||
            ('cancelled' in result && result.cancelled);
        if (canceled) {
            // eslint-disable-next-line consistent-return
            return undefined;
        }

        // Handle the asset returned (Expo’s new API returns an assets array)
        const imageAsset = result.assets ? result.assets[0] : result;

        if (Platform.OS === 'web') {
            // For web, if base64 is provided, use it to create a proper File
            if (imageAsset.base64) {
                // Try to get fileName from the asset; fallback to a default name
                const fileName =
                    imageAsset.fileName ||
                    imageAsset.uri.split('/').pop() ||
                    'upload.jpg';
                // Determine MIME type using the fileName rather than the URI
                let mimeType = getMimeType(fileName);
                if (mimeType === 'application/octet-stream') {
                    // Fallback to a common type if unable to detect
                    mimeType = 'image/jpeg';
                }
                const dataUrl = `data:${mimeType};base64,${imageAsset.base64}`;
                setFileData(dataUrl);
                return dataURLtoFile(dataUrl, fileName);
            }

            // Otherwise, fetch the URL and convert the blob to a File
            const response = await fetch(imageAsset.uri);
            const blob = await response.blob();
            const fileName = imageAsset.uri.split('/').pop() || 'upload';
            const mimeType = blob.type || getMimeType(imageAsset.uri);
            const file = new File([blob], fileName, {
                type: mimeType,
                lastModified: Date.now(),
            });
            setFileData(imageAsset.uri);
            return file;
        }

        // For native platforms, simply return an object with file details
        setFileData(imageAsset.uri);
        const fileName = imageAsset.uri.split('/').pop() || 'upload';
        const mimeType = getMimeType(fileName);
        return {
            uri: imageAsset.uri,
            type: mimeType,
            name: fileName,
        };
    };

    return { fileData, pickFile };
};
