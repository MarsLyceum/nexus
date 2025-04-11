import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
    useEffect,
    ReactNode,
} from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

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
const PortalContext = createContext<PortalContextType | null>(null);

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

/**
 * Portal: use this component anywhere to render children into the host
 */
export const Portal: React.FC<{ children: ReactNode }> = ({ children }) => {
    const context = useContext(PortalContext);
    if (!context) {
        throw new Error('Portal must be used within a PortalProvider');
    }
    const { mount, update, unmount } = context;
    const keyRef = useRef<number | null>(null);

    // Mount on first render
    useEffect(() => {
        keyRef.current = mount(children);
        return () => {
            if (keyRef.current !== null) {
                unmount(keyRef.current);
            }
        };
    }, []);

    // Update on children change
    useEffect(() => {
        if (keyRef.current !== null) {
            update(keyRef.current, children);
        }
    }, [children]);

    return null;
};
