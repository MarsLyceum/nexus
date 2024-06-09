// src/mocks/PermissionsAndroid.js
export default {
    request: async () => 'granted',
    check: async () => 'granted',
    PERMISSIONS: {},
    RESULTS: {
        GRANTED: 'granted',
        DENIED: 'denied',
        NEVER_ASK_AGAIN: 'never_ask_again',
    },
};
