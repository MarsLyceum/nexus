const isDOMAvailable =
    typeof window !== 'undefined' && !!window.document?.createElement;

const canUseEventListeners = isDOMAvailable
    ? !!(window.addEventListener || window.attachEvent)
    : false;

const canUseViewport = isDOMAvailable ? !!window.screen : false;

const isAsyncDebugging = false;

export {
    isDOMAvailable,
    canUseEventListeners,
    canUseViewport,
    isAsyncDebugging,
};
