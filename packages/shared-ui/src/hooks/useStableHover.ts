import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Platform } from 'react-native';

import { useIsComputer } from './useIsComputer';

type HoverConfig = {
    closeDelayMs?: number;
    leaveGapMs?: number;
    onEnter?: () => void;
    onLeave?: () => void;
    debugLabel?: string;
};

const DEFAULT_LEAVE_GAP = 160;

type HoverHandlers = {
    onPointerEnter: () => void;
    onPointerLeave: () => void;
};

type StableHover = {
    handlers: HoverHandlers;
    isHovering: boolean;
    registerBounds: (getRect: () => DOMRect | undefined) => void;
};

type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;

export const useStableHover = ({
    closeDelayMs = 200,
    leaveGapMs = DEFAULT_LEAVE_GAP,
    onEnter,
    onLeave,
    debugLabel = 'stable-hover',
}: HoverConfig = {}): StableHover => {
    const isComputer = useIsComputer();
    const [isHovering, setIsHovering] = useState(false);
    const closeTimeoutRef = useRef<TimeoutHandle | null>(null);
    const gapTimeoutRef = useRef<TimeoutHandle | null>(null);
    const getBoundsRef = useRef<() => DOMRect | undefined>(() => undefined);
    const isOpenRef = useRef(false);

    const clearCloseTimeout = useCallback(() => {
        if (closeTimeoutRef.current) {
            globalThis.clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    }, []);

    const clearGapTimeout = useCallback(() => {
        if (gapTimeoutRef.current) {
            globalThis.clearTimeout(gapTimeoutRef.current);
            gapTimeoutRef.current = null;
        }
    }, []);

    const log = useCallback(
        (message: string, extra?: Record<string, unknown>) => {
            if (__DEV__) {
                // eslint-disable-next-line no-console
                console.log(`[useStableHover:${debugLabel}] ${message}`, extra);
            }
        },
        [debugLabel]
    );

    const open = useCallback(() => {
        clearGapTimeout();
        clearCloseTimeout();
        if (!isOpenRef.current) {
            log('open');
            onEnter?.();
            isOpenRef.current = true;
        }
        setIsHovering(true);
    }, [clearCloseTimeout, clearGapTimeout, log, onEnter]);

    const commitClose = useCallback(() => {
        if (isOpenRef.current) {
            log('commit-close');
            isOpenRef.current = false;
            setIsHovering(false);
            onLeave?.();
        }
    }, [log, onLeave]);

    const scheduleClose = useCallback(() => {
        clearCloseTimeout();
        log('schedule-close', { closeDelayMs });
        closeTimeoutRef.current = globalThis.setTimeout(() => {
            commitClose();
        }, closeDelayMs);
    }, [clearCloseTimeout, closeDelayMs, commitClose, log]);

    const handlePointerEnter = useCallback(() => {
        log('pointer-enter');
        open();
    }, [log, open]);

    const handlePointerLeave = useCallback(() => {
        if (!isOpenRef.current) {
            log('pointer-leave-ignored');
            return;
        }
        clearGapTimeout();
        log('pointer-leave-scheduled', { leaveGapMs });
        gapTimeoutRef.current = globalThis.setTimeout(() => {
            scheduleClose();
            gapTimeoutRef.current = null;
        }, leaveGapMs);
    }, [clearGapTimeout, leaveGapMs, log, scheduleClose]);

    const registerBounds = useCallback((getter: () => DOMRect | undefined) => {
        getBoundsRef.current = getter;
    }, []);

    useEffect(() => {
        if (!isComputer || Platform.OS !== 'web') {
            return undefined;
        }

        return () => {
            clearGapTimeout();
            clearCloseTimeout();
            commitClose();
        };
    }, [clearCloseTimeout, clearGapTimeout, commitClose, isComputer]);

    useEffect(() => {
        const rect = getBoundsRef.current();
        if (!rect && isOpenRef.current) {
            log('bounds-missing-close');
            commitClose();
        }
    }, [commitClose, log]);

    return useMemo(
        () => ({
            handlers: {
                onPointerEnter: handlePointerEnter,
                onPointerLeave: handlePointerLeave,
            },
            isHovering,
            registerBounds,
            debugLabel,
        }),
        [
            debugLabel,
            handlePointerEnter,
            handlePointerLeave,
            isHovering,
            registerBounds,
        ]
    );
};
