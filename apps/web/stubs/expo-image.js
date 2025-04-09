// apps/web/stubs/expo-image.js
const ExpoImage = require('expo-image');

try {
    if (ExpoImage && ExpoImage.ImageModule) {
        const descriptor = Object.getOwnPropertyDescriptor(
            ExpoImage.ImageModule,
            'name'
        );
        if (descriptor && !descriptor.writable) {
            // Patch the "name" property to be writable.
            Object.defineProperty(ExpoImage.ImageModule, 'name', {
                value: descriptor.value,
                writable: true,
                configurable: true,
                enumerable: descriptor.enumerable,
            });
        }
    }
} catch (e) {
    console.warn('Failed to patch expo-image ImageModule:', e);
}

// Instead of re-exporting a default export (which may cause circular dependency issues),
// we simply export all properties from expo-image.
module.exports = ExpoImage;
