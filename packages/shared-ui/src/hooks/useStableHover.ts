import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Platform } from 'react-native';

import { isStableHoverGroupMember } from '../utils/stableHoverGroup';
import { useIsComputer } from './useIsComputer';

type HoverConfig = {
    closeDelayMs?: number;
    leaveGapMs?: number;
    onEnter?: () => void;
    onLeave?: () => void;
    debugLabel?: string;
    allowReentrantEnter?: boolean;
    suppressNestedTracking?: boolean;
};

const DEFAULT_LEAVE_GAP = 0;
const DEFAULT_CLOSE_DELAY = 0;
const BOUNDS_POLL_INTERVAL = 100;
const BOUNDS_FAILURE_LIMIT = 5;

type PointerLeaveDetails = {
    clientX: number;
    clientY: number;
    rect?: DOMRect;
    containsRelated?: boolean;
    relatedTarget?: Element | null;
};

type PointerLeaveResult =
    | 'scheduled'
    | 'ignored-not-open'
    | 'ignored-contained'
    | 'ignored-inside-rect';
type PointerEnterResult = 'opened' | 'reused';

type HoverHandlers = {
    onPointerEnter: () => PointerEnterResult;
    onPointerLeave: (details?: PointerLeaveDetails) => PointerLeaveResult;
};

type StableHover = {
    handlers: HoverHandlers;
    isHovering: boolean;
    registerBounds: (getRect: () => DOMRect | undefined) => void;
    debugLabel: string;
};

type TimeoutHandle = ReturnType<typeof globalThis.setTimeout>;
type CloseReason = 'scheduled-timeout' | 'bounds-missing' | 'cleanup';

export const useStableHover = ({
    closeDelayMs = DEFAULT_CLOSE_DELAY,
    leaveGapMs = DEFAULT_LEAVE_GAP,
    onEnter,
    onLeave,
    debugLabel = 'stable-hover',
    allowReentrantEnter = false,
    suppressNestedTracking = false,
}: HoverConfig = {}): StableHover => {
    const isComputer = useIsComputer();
    const [isHovering, setIsHovering] = useState(false);
    const closeTimeoutRef = useRef<TimeoutHandle | null>(null);
    const gapTimeoutRef = useRef<TimeoutHandle | null>(null);
    const boundsIntervalRef = useRef<TimeoutHandle | null>(null);
    const getBoundsRef = useRef<() => DOMRect | undefined>(() => undefined);
    const hasBoundsRef = useRef(false);
    const isOpenRef = useRef(false);
    const missingBoundsCountRef = useRef(0);
    const lastRectRef = useRef<DOMRect | null>(null);
    const pendingLeaveDetailsRef = useRef<PointerLeaveDetails | undefined>(
        undefined
    );
    const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(
        null
    );
    const pointerMoveListenerRef = useRef<
        ((event: PointerEvent) => void) | null
    >(null);
    const onEnterRef = useRef(onEnter);
    const onLeaveRef = useRef(onLeave);

    useEffect(() => {
        onEnterRef.current = onEnter;
        onLeaveRef.current = onLeave;
    }, [onEnter, onLeave]);

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

    const clearBoundsInterval = useCallback(() => {
        if (boundsIntervalRef.current) {
            globalThis.clearInterval(boundsIntervalRef.current);
            boundsIntervalRef.current = null;
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

    const isPointInsideRect = useCallback(
        (rect: DOMRect, x: number, y: number) =>
            x >= rect.left &&
            x <= rect.right &&
            y >= rect.top &&
            y <= rect.bottom,
        []
    );

    const startPointerTracking = useCallback(() => {
        if (suppressNestedTracking || Platform.OS !== 'web') {
            return;
        }
        if (pointerMoveListenerRef.current) {
            return;
        }
        const listener = (event: PointerEvent) => {
            lastPointerPositionRef.current = {
                x: event.clientX,
                y: event.clientY,
            };
        };
        pointerMoveListenerRef.current = listener;
        globalThis.addEventListener('pointermove', listener, { passive: true });
    }, []);

    const stopPointerTracking = useCallback(() => {
        const listener = pointerMoveListenerRef.current;
        if (!listener) {
            return;
        }
        globalThis.removeEventListener('pointermove', listener);
        pointerMoveListenerRef.current = null;
        lastPointerPositionRef.current = null;
    }, []);

    const open = useCallback(() => {
        clearGapTimeout();
        clearCloseTimeout();
        clearBoundsInterval();
        missingBoundsCountRef.current = 0;
        const rect = getBoundsRef.current();
        log('open-get-bounds', {
            rectWidth: rect?.width,
            rectHeight: rect?.height,
            rectTop: rect?.top,
            rectBottom: rect?.bottom,
            rectLeft: rect?.left,
            rectRight: rect?.right,
            lastRectWidth: lastRectRef.current?.width,
            lastRectHeight: lastRectRef.current?.height,
            hasBounds: hasBoundsRef.current,
            hasGetter: Boolean(getBoundsRef.current),
        });
        if (rect) {
            lastRectRef.current = rect;
            hasBoundsRef.current = true;
        } else if (!hasBoundsRef.current) {
            log('open-missing-bounds-initial');
        }
        if (!isOpenRef.current) {
            log('open', { rectExists: Boolean(rect) });
            onEnterRef.current?.();
            isOpenRef.current = true;
        }
        if (!suppressNestedTracking) {
            startPointerTracking();
        }
        if (!suppressNestedTracking) {
            startPointerTracking();
        }
        setIsHovering(true);
    }, [
        clearBoundsInterval,
        clearCloseTimeout,
        clearGapTimeout,
        log,
        startPointerTracking,
    ]);

    const commitClose = useCallback(
        (reason: CloseReason) => {
            if (isOpenRef.current) {
                log('commit-close', { reason });
                isOpenRef.current = false;
                setIsHovering(false);
                clearBoundsInterval();
                onLeaveRef.current?.();
                stopPointerTracking();
            }
        },
        [clearBoundsInterval, log, stopPointerTracking]
    );

    const scheduleClose = useCallback(() => {
        clearCloseTimeout();
        log('schedule-close', { closeDelayMs, label: debugLabel });
        closeTimeoutRef.current = globalThis.setTimeout(() => {
            commitClose('scheduled-timeout');
        }, closeDelayMs);
    }, [clearCloseTimeout, closeDelayMs, commitClose, log, debugLabel]);

    const handlePointerEnter = useCallback((): PointerEnterResult => {
        log('pointer-enter', {
            isOpen: isOpenRef.current,
            allowReentrantEnter,
            suppressNestedTracking,
        });
        if (isOpenRef.current) {
            clearGapTimeout();
            clearCloseTimeout();
            pendingLeaveDetailsRef.current = undefined;
            if (!suppressNestedTracking) {
                startPointerTracking();
            }
            log('pointer-enter-reused', {
                allowReentrantEnter,
            });
            return 'reused';
        }
        open();
        return 'opened';
    }, [
        allowReentrantEnter,
        clearCloseTimeout,
        clearGapTimeout,
        log,
        open,
        startPointerTracking,
        suppressNestedTracking,
    ]);

    const handlePointerLeave = useCallback(
        (details?: PointerLeaveDetails): PointerLeaveResult => {
            const isModalEscape = Boolean(
                details?.relatedTarget &&
                    allowReentrantEnter &&
                    isStableHoverGroupMember(details.relatedTarget)
            );

            if (!isOpenRef.current && !isModalEscape) {
                log('pointer-leave-ignored', { reason: 'not-open' });
                return 'ignored-not-open';
            }

            if (details?.containsRelated && !isModalEscape) {
                log('pointer-leave-ignored', {
                    reason: 'contained',
                    containsRelated: details.containsRelated,
                });
                return 'ignored-contained';
            }

            if (
                !hasBoundsRef.current &&
                details?.rect &&
                details.rect.width > 0 &&
                details.rect.height > 0
            ) {
                lastRectRef.current = details.rect;
                hasBoundsRef.current = true;
                missingBoundsCountRef.current = 0;
                log('pointer-leave-adopted-rect', {
                    width: details.rect.width,
                    height: details.rect.height,
                });
            }

            pendingLeaveDetailsRef.current = details;
            clearGapTimeout();
            const lastRect = lastRectRef.current;
            log('pointer-leave-scheduled', {
                leaveGapMs,
                lastRectWidth: lastRect?.width,
                lastRectHeight: lastRect?.height,
                lastRectTop: lastRect?.top,
                lastRectBottom: lastRect?.bottom,
                lastRectLeft: lastRect?.left,
                lastRectRight: lastRect?.right,
                hasBounds: hasBoundsRef.current,
                insideRectWhenCalled:
                    details?.rect &&
                    isPointInsideRect(
                        details.rect,
                        details.clientX,
                        details.clientY
                    ),
            });
            gapTimeoutRef.current = globalThis.setTimeout(() => {
                const pending = pendingLeaveDetailsRef.current;
                pendingLeaveDetailsRef.current = undefined;

                const rect = getBoundsRef.current();
                const pointerPoint =
                    lastPointerPositionRef.current ??
                    (pending?.clientX !== undefined &&
                    pending?.clientY !== undefined
                        ? {
                              x: pending.clientX,
                              y: pending.clientY,
                          }
                        : undefined);

                const activeRect = rect ?? pending?.rect;

                if (!allowReentrantEnter && activeRect && pointerPoint) {
                    const { x, y } = pointerPoint;
                    if (isPointInsideRect(activeRect, x, y)) {
                        log('pointer-leave-gap-cancelled', {
                            reason: 'pointer-inside',
                            clientX: x,
                            clientY: y,
                            rectTop: activeRect.top,
                            rectBottom: activeRect.bottom,
                            rectLeft: activeRect.left,
                            rectRight: activeRect.right,
                            rectSource: rect ? 'current' : 'pending',
                        });
                        gapTimeoutRef.current = null;
                        return;
                    }
                }

                log('pointer-leave-gap-elapsed', {
                    rectWidth: rect?.width,
                    rectHeight: rect?.height,
                    rectTop: rect?.top,
                    rectBottom: rect?.bottom,
                    rectLeft: rect?.left,
                    rectRight: rect?.right,
                    lastRectWidth: lastRectRef.current?.width,
                    lastRectHeight: lastRectRef.current?.height,
                    lastRectTop: lastRectRef.current?.top,
                    lastRectBottom: lastRectRef.current?.bottom,
                    lastRectLeft: lastRectRef.current?.left,
                    lastRectRight: lastRectRef.current?.right,
                    hasBounds: hasBoundsRef.current,
                });
                scheduleClose();
                gapTimeoutRef.current = null;
            }, leaveGapMs);

            return 'scheduled';
        },
        [clearGapTimeout, isPointInsideRect, leaveGapMs, log, scheduleClose]
    );

    const registerBounds = useCallback(
        (getter: () => DOMRect | undefined) => {
            getBoundsRef.current = () => {
                const rect = getter();
                if (rect && rect.width > 0 && rect.height > 0) {
                    log('bounds-success-fresh', {
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                    });
                    lastRectRef.current = rect;
                    hasBoundsRef.current = true;
                    missingBoundsCountRef.current = 0;
                    return rect;
                }

                if (
                    lastRectRef.current &&
                    lastRectRef.current.width > 0 &&
                    lastRectRef.current.height > 0
                ) {
                    log('bounds-success-cached', {
                        width: lastRectRef.current.width,
                        height: lastRectRef.current.height,
                        top: lastRectRef.current.top,
                        bottom: lastRectRef.current.bottom,
                        left: lastRectRef.current.left,
                        right: lastRectRef.current.right,
                        rejectedWidth: rect?.width,
                        rejectedHeight: rect?.height,
                        rejectedTop: rect?.top,
                        rejectedBottom: rect?.bottom,
                        rejectedLeft: rect?.left,
                        rejectedRight: rect?.right,
                    });
                    hasBoundsRef.current = true;
                    return lastRectRef.current;
                }

                hasBoundsRef.current = false;
                log('bounds-missing', {
                    rejectedWidth: rect?.width,
                    rejectedHeight: rect?.height,
                    rejectedTop: rect?.top,
                    rejectedBottom: rect?.bottom,
                    rejectedLeft: rect?.left,
                    rejectedRight: rect?.right,
                });
                return undefined;
            };

            clearBoundsInterval();
            if (isComputer && Platform.OS === 'web') {
                boundsIntervalRef.current = globalThis.setInterval(() => {
                    if (!isOpenRef.current) {
                        return;
                    }
                    const rect = getBoundsRef.current();
                    if (!rect) {
                        if (!hasBoundsRef.current) {
                            log('bounds-poll-skipped', {
                                reason: 'no-successful-bounds-yet',
                                attempts: missingBoundsCountRef.current,
                                getterDefined: Boolean(getBoundsRef.current),
                                isOpen: isOpenRef.current,
                            });
                            missingBoundsCountRef.current = 0;
                            return;
                        }
                        missingBoundsCountRef.current += 1;
                        log('bounds-poll-missing', {
                            attempts: missingBoundsCountRef.current,
                            lastRectWidth: lastRectRef.current?.width,
                            lastRectHeight: lastRectRef.current?.height,
                            lastRectTop: lastRectRef.current?.top,
                            lastRectBottom: lastRectRef.current?.bottom,
                            lastRectLeft: lastRectRef.current?.left,
                            lastRectRight: lastRectRef.current?.right,
                            hasBounds: hasBoundsRef.current,
                            getterDefined: Boolean(getBoundsRef.current),
                            isOpen: isOpenRef.current,
                        });
                        if (
                            missingBoundsCountRef.current >=
                            BOUNDS_FAILURE_LIMIT
                        ) {
                            clearBoundsInterval();
                            commitClose('bounds-missing');
                        }
                        return;
                    }
                    log('bounds-poll-success', {
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        bottom: rect.bottom,
                        left: rect.left,
                        right: rect.right,
                        hasBounds: hasBoundsRef.current,
                        isOpen: isOpenRef.current,
                    });
                    missingBoundsCountRef.current = 0;
                }, BOUNDS_POLL_INTERVAL);
            }
        },
        [clearBoundsInterval, commitClose, isComputer, log]
    );

    useEffect(() => {
        if (!isComputer || Platform.OS !== 'web') {
            return undefined;
        }

        return () => {
            clearGapTimeout();
            clearCloseTimeout();
            clearBoundsInterval();
            stopPointerTracking();
            commitClose('cleanup');
        };
    }, [
        clearBoundsInterval,
        clearCloseTimeout,
        clearGapTimeout,
        commitClose,
        isComputer,
        stopPointerTracking,
    ]);

    useEffect(() => {
        const rect = getBoundsRef.current();
        if (!rect || rect.width <= 0 || rect.height <= 0) {
            if (!isOpenRef.current || !hasBoundsRef.current) {
                return;
            }
            missingBoundsCountRef.current += 1;
            if (missingBoundsCountRef.current < 2) {
                return;
            }
            commitClose('bounds-missing');
            return;
        }
        missingBoundsCountRef.current = 0;
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
