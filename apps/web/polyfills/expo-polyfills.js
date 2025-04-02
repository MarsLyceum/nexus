import { EventEmitter } from 'expo-modules-core';

console.log(
    'Expo polyfills injected:',
    globalThis.expo,
    'EventEmitter',
    EventEmitter
);
