// apps/web/polyfills/expo-polyfills.ts
import * as ExpoModulesCore from 'expo-modules-core';

const ExpoSharedObject = ExpoModulesCore.SharedObject;

if (typeof globalThis.expo === 'undefined') {
    (globalThis as any).expo = {};
}

if (ExpoSharedObject) {
    // Wrap ExpoSharedObject in a Proxy that ignores writes to its "name" property.
    const proxiedSharedObject = new Proxy(ExpoSharedObject, {
        set(target, prop, value, receiver) {
            if (prop === 'name') {
                return true; // ignore any attempt to modify "name"
            }
            return Reflect.set(target, prop, value, receiver);
        },
    });
    (globalThis as any).expo.SharedObject = proxiedSharedObject;
} else if (typeof (globalThis as any).expo.SharedObject === 'undefined') {
    // Fallback stub if ExpoSharedObject is not available.
    class SharedObjectStub {}
    Object.defineProperty(SharedObjectStub, 'name', {
        value: 'SharedObjectStub',
        writable: true,
        configurable: true,
        enumerable: true,
    });
    (globalThis as any).expo.SharedObject = SharedObjectStub;
}

console.log('Expo polyfills injected:', (globalThis as any).expo.SharedObject);
