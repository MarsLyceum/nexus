// // apps/web/polyfills/expo-polyfills.ts
// import * as ExpoModulesCore from 'expo-modules-core';

// const ExpoSharedObject = ExpoModulesCore.SharedObject;

// if (typeof globalThis.expo === 'undefined') {
//     globalThis.expo = {};
// }

// if (ExpoSharedObject) {
//     globalThis.expo.SharedObject = ExpoSharedObject;
// } else if (typeof globalThis.expo.SharedObject === 'undefined') {
//     // Fallback stub if ExpoSharedObject is not available.
//     class SharedObjectStub {}
//     globalThis.expo.SharedObject = SharedObjectStub;
// }

// console.log('Expo polyfills injected:', globalThis.expo.SharedObject);

// const exports = {};
// Object.defineProperty(exports, '__esModule', { value: true });

// import { ensureNativeModulesAreInstalled } from 'expo-modules-core/src/ensureNativeModulesAreInstalled';

import { EventEmitter } from 'expo-modules-core';

console.log(
    'Expo polyfills injected:',
    globalThis.expo,
    'EventEmitter',
    EventEmitter
);
