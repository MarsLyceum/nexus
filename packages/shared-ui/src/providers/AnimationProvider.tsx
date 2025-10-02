import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { hasWebGPU } from '../components/WebGPUGlow';

type AnimationDriver = 'css' | 'gpu';
export type AnimationDriverPreference = AnimationDriver | 'auto';

type AnimationCapabilities = {
    readonly gpu: boolean;
};

type AnimationContextValue = {
    readonly preferredDriver: AnimationDriverPreference;
    readonly effectiveDriver: AnimationDriver;
    readonly availableDrivers: ReadonlyArray<AnimationDriver>;
    readonly capabilities: AnimationCapabilities;
    readonly selectDriver: (driver: AnimationDriverPreference) => void;
    readonly reportDriverFailure: (driver: AnimationDriver) => void;
    readonly reportDriverRecovery: (driver: AnimationDriver) => void;
};

const AnimationContext = createContext<AnimationContextValue | undefined>(
    undefined
);

const resolveDriver = (
    preference: AnimationDriverPreference,
    capabilities: AnimationCapabilities,
    failedDrivers: ReadonlySet<AnimationDriver>
): AnimationDriver => {
    const canUseGpu = capabilities.gpu && !failedDrivers.has('gpu');
    if (preference === 'css') {
        return 'css';
    }
    if (preference === 'gpu') {
        return canUseGpu ? 'gpu' : 'css';
    }
    return canUseGpu ? 'gpu' : 'css';
};

const computeCapabilities = (): AnimationCapabilities => ({
    gpu: hasWebGPU(),
});

const removeDriver = (
    drivers: ReadonlySet<AnimationDriver>,
    driver: AnimationDriver
) => {
    if (!drivers.has(driver)) {
        return drivers;
    }
    const next = new Set<AnimationDriver>();
    drivers.forEach((value) => {
        if (value !== driver) {
            next.add(value);
        }
    });
    return next;
};

const addDriver = (
    drivers: ReadonlySet<AnimationDriver>,
    driver: AnimationDriver
) => {
    if (drivers.has(driver)) {
        return drivers;
    }
    const next = new Set<AnimationDriver>(drivers);
    next.add(driver);
    return next;
};

export const AnimationProvider: React.FC<{
    readonly children: React.ReactNode;
    readonly defaultPreference?: AnimationDriverPreference;
}> = ({ children, defaultPreference = 'auto' }) => {
    const [preferredDriver, setPreferredDriver] =
        useState<AnimationDriverPreference>(defaultPreference);
    const [failedDrivers, setFailedDrivers] = useState<
        ReadonlySet<AnimationDriver>
    >(new Set());

    const capabilities = useMemo(() => computeCapabilities(), []);

    const availableDrivers = useMemo(() => {
        const drivers: AnimationDriver[] = ['css'];
        return capabilities.gpu ? [...drivers, 'gpu'] : drivers;
    }, [capabilities.gpu]);

    const effectiveDriver = useMemo(
        () => resolveDriver(preferredDriver, capabilities, failedDrivers),
        [preferredDriver, capabilities, failedDrivers]
    );

    const selectDriver = useCallback((driver: AnimationDriverPreference) => {
        setPreferredDriver(driver);
        setFailedDrivers((prev) =>
            driver === 'css' ? prev : removeDriver(prev, 'gpu')
        );
    }, []);

    const reportDriverFailure = useCallback((driver: AnimationDriver) => {
        setFailedDrivers((prev) => addDriver(prev, driver));
    }, []);

    const reportDriverRecovery = useCallback((driver: AnimationDriver) => {
        setFailedDrivers((prev) => removeDriver(prev, driver));
    }, []);

    const contextValue = useMemo<AnimationContextValue>(
        () => ({
            preferredDriver,
            effectiveDriver,
            availableDrivers,
            capabilities,
            selectDriver,
            reportDriverFailure,
            reportDriverRecovery,
        }),
        [
            preferredDriver,
            effectiveDriver,
            availableDrivers,
            capabilities,
            selectDriver,
            reportDriverFailure,
            reportDriverRecovery,
        ]
    );

    return (
        <AnimationContext.Provider value={contextValue}>
            {children}
        </AnimationContext.Provider>
    );
};

export const useAnimationDriver = () => {
    const context = useContext(AnimationContext);
    if (!context) {
        throw new Error(
            'useAnimationDriver must be used within AnimationProvider'
        );
    }
    return context;
};
