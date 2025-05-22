import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
    useEffect,
    ReactNode,
} from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    BackHandler,
    Platform,
} from 'react-native';

/**
 * Context type for managing portals
 */
type PortalContextType = {
    mount: (children: ReactNode) => number;
    update: (key: number, children: ReactNode) => void;
    unmount: (key: number) => void;
};

/**
 * Create a Context for the portal system
 */
const PortalContext = createContext<PortalContextType | undefined>(undefined);

/**
 * PortalProvider: wraps your app and renders portals at top level
 */
export const PortalProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [portals, setPortals] = useState<Record<number, ReactNode>>({});
    const nextKey = useRef(0);

    const mount = useCallback((childrenInner: ReactNode) => {
        const key = nextKey.current++;
        setPortals((prev) => ({ ...prev, [key]: childrenInner }));
        return key;
    }, []);

    const update = useCallback((key: number, childrenInner: ReactNode) => {
        setPortals((prev) => {
            if (!(key in prev)) return prev;
            return { ...prev, [key]: childrenInner };
        });
    }, []);

    const unmount = useCallback((key: number) => {
        setPortals((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const context = { mount, update, unmount };

    return (
        <PortalContext.Provider value={context}>
            {children}
            {/* Host container for portals */}
            <View
                pointerEvents="box-none"
                style={StyleSheet.absoluteFill as ViewStyle}
            >
                {Object.entries(portals).map(([key, element]) => (
                    <React.Fragment key={key}>{element}</React.Fragment>
                ))}
            </View>
        </PortalContext.Provider>
    );
};

export type PortalProps = {
    children: ReactNode;
    visible?: boolean;
    onRequestClose?: () => void;
};

/**
 * Portal: use this component anywhere to render children into the host
 */
export const Portal: React.FC<PortalProps> = ({
    children,
    onRequestClose,
    visible = true,
}) => {
    const context = useContext(PortalContext);
    if (!context) {
        throw new Error('Portal must be used within a PortalProvider');
    }
    const { mount, update, unmount } = context;
    const keyRef = useRef<number | null>(null);

    useEffect(() => {
        if (!visible) {
            // if we're not visible, ensure unmounted
            if (keyRef.current !== null) {
                unmount(keyRef.current);
                // eslint-disable-next-line unicorn/no-null
                keyRef.current = null;
            }
            return;
        }

        keyRef.current = mount(children);

        // Hook the Android back button if they gave us onRequestClose
        const backSub = onRequestClose
            ? BackHandler.addEventListener('hardwareBackPress', () => {
                  onRequestClose();
                  return true;
              })
            : undefined;

        let escListener: ((e: KeyboardEvent) => void) | undefined;
        if (onRequestClose && Platform.OS === 'web') {
            escListener = (e) => {
                if (e.key === 'Escape') onRequestClose();
            };
            globalThis.addEventListener('keydown', escListener);
        }

        // eslint-disable-next-line consistent-return
        return () => {
            if (backSub) backSub.remove();
            if (escListener)
                globalThis.removeEventListener('keydown', escListener);
            if (keyRef.current !== null) {
                unmount(keyRef.current);
                // eslint-disable-next-line unicorn/no-null
                keyRef.current = null;
            }
        };
    }, [visible]);

    // Update on children change
    useEffect(() => {
        if (visible && keyRef.current !== null) {
            update(keyRef.current, children);
        }
    }, [children]);

    return undefined;
};
