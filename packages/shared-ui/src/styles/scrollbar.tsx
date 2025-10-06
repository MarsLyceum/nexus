import React, {
    useMemo,
    useRef,
    useState,
    useCallback,
    useEffect,
} from 'react';
import { Platform, View, ScrollView } from 'react-native';

import { useTheme } from '../theme';
import { toRgba } from '../utils';
import { BorderRadius } from '../constants/designSystem';
import { Glow } from '../effects/glow';

export const DEFAULT_SCROLLBAR_THICKNESS = 14;
const THUMB_MIN_HEIGHT = 20;
const PERCEIVED_THUMB_WIDTH = 5.5;

// Temporary debug logging
const DEBUG_SCROLLBAR = true;
const debugLog = (...args: ReadonlyArray<unknown>) => {
    if (DEBUG_SCROLLBAR) {
        // eslint-disable-next-line no-console
        console.log('[CustomScrollbar]', ...args);
    }
};

// Helpers to read static numeric values from style
const toNumericPx = (value: unknown): number | undefined => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const match = /^(\s*-?\d+(?:\.\d+)?)\s*(?:px)?\s*$/.exec(value);
        if (match) return Number.parseFloat(match[1]);
    }
    return undefined;
};

const getStaticBorderThickness = (style?: Record<string, unknown>): number => {
    if (!style) return 0;
    const readBorder = (key: string) => toNumericPx(style[key]);
    const right =
        'borderRightWidth' in style
            ? readBorder('borderRightWidth')
            : undefined;
    const all = 'borderWidth' in style ? readBorder('borderWidth') : undefined;
    return right ?? all ?? 0;
};

const RAIL_THICKNESS = 7;
const LANE_INSET = 1;
const LANE_WIDTH = RAIL_THICKNESS;
const CONTENT_MIRROR_GUTTER = 0;

const ANTIALIAS_TOLERANCE = 0.6;
const RIM_CLEARANCE = 0.75;
const CORNER_HEADROOM = 0.6;

const HOVER_SCALE = 1.09;
const DRAG_SCALE = 1.15;

const snapToPixel = (value: number, dpr: number): number =>
    Math.round(value * dpr) / dpr;
// Removed unused pixel-floor helper to avoid linter error

// Debug types removed

// Debug logger removed for production

const clamp = (value: number, lower: number, upper: number): number =>
    Math.min(upper, Math.max(lower, value));

const getMatchMedia = (): ((query: string) => MediaQueryList) | undefined =>
    typeof globalThis.matchMedia === 'function'
        ? globalThis.matchMedia.bind(globalThis)
        : undefined;

type WindowEventManager = {
    addEventListener: (type: string, listener: () => void) => void;
    removeEventListener: (type: string, listener: () => void) => void;
};

type VisualViewportManager = {
    scale?: number;
    addEventListener: (type: 'resize' | 'scroll', listener: () => void) => void;
    removeEventListener: (
        type: 'resize' | 'scroll',
        listener: () => void
    ) => void;
};

const readDevicePixelRatio = (): number => {
    const ratio = (globalThis as Partial<typeof globalThis>).devicePixelRatio;
    return typeof ratio === 'number' ? ratio : 1;
};

const readVisualViewport = (): VisualViewportManager | undefined => {
    const viewport = (
        globalThis as Partial<typeof globalThis> & {
            visualViewport?: VisualViewportManager;
        }
    ).visualViewport;
    return viewport &&
        typeof viewport.addEventListener === 'function' &&
        typeof viewport.removeEventListener === 'function'
        ? viewport
        : undefined;
};

const hasGlobalEventListeners = (): boolean => {
    const maybeWindow = globalThis as Partial<WindowEventManager>;
    return (
        typeof maybeWindow.addEventListener === 'function' &&
        typeof maybeWindow.removeEventListener === 'function'
    );
};

type ThumbGeometry = {
    baseRightInset: number;
    baseMaskRadius: number;
    paintWidth: number;
    slack: number;
};

// Static computation of the visible inner radius from the container's radius
const computeVisibleInnerRadius = (
    containerRadius: number,
    containerBorderThickness: number
): number => Math.max(0, containerRadius - containerBorderThickness);

const buildThumbGeometry = (
    visibleRadius: number,
    perceivedThumbWidth: number
): ThumbGeometry => {
    const slack = (RAIL_THICKNESS - perceivedThumbWidth) / 2;
    const baseRightInset = RIM_CLEARANCE + slack;
    const baseMaskRadius = Math.max(0, visibleRadius - baseRightInset);
    const paintWidth =
        perceivedThumbWidth + ANTIALIAS_TOLERANCE + CORNER_HEADROOM;

    return { baseRightInset, baseMaskRadius, paintWidth, slack };
};

const collectSelectors = (selectors: string): string[] =>
    selectors
        .split(',')
        .map((selector) => selector.trim())
        .filter((selector) => selector.length > 0);

type ScrollbarStylesProps = {
    targetSelector?: string;
};

type ThemedScrollbarHook = () => {
    ScrollbarStyles: React.FC<ScrollbarStylesProps>;
};

export const useThemedScrollbars: ThemedScrollbarHook = () => {
    const { theme } = useTheme();

    const ScrollbarStyles = useMemo(() => {
        const buildStyles = (targetSelector: string) => {
            const selectors = collectSelectors(targetSelector);
            if (selectors.length === 0) {
                return '';
            }

            const selectorList = selectors.join(', ');
            const webkitSelectors = selectors
                .map((selector) => `${selector}::-webkit-scrollbar`)
                .join(', ');

            return `
                ${selectorList} {
                    scrollbar-width: none;
                }

                ${webkitSelectors} {
                    display: none;
                }

                ${selectorList} {
                    overflow: auto;
                }
            `;
        };

        const Component: React.FC<ScrollbarStylesProps> = ({
            targetSelector = 'body',
        }) => {
            if (Platform.OS !== 'web') {
                return null;
            }

            const styleContent = buildStyles(targetSelector);
            if (!styleContent) {
                return null;
            }

            return <style>{styleContent}</style>;
        };

        Component.displayName = 'ThemedScrollbarStyles';

        return Component;
    }, [theme]);

    return { ScrollbarStyles };
};

type NexusScrollViewProps = {
    children: React.ReactNode;
    style?: Record<string, unknown>;
    contentContainerStyle?: Record<string, unknown>;
    nativeID?: string;
    maxHeight?: number;
    containerRadius?: number;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
    scrollEventThrottle?: number;
};

const WebNexusScrollView: React.FC<NexusScrollViewProps> = ({
    children,
    style,
    contentContainerStyle,
    nativeID,
    maxHeight,
    containerRadius = BorderRadius.Small,
}) => {
    const { theme } = useTheme();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollState, setScrollState] = useState({
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const dragStartRef = useRef({ y: 0, scrollTop: 0 });
    const thumbViewportRef = useRef<HTMLDivElement | null>(null);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const next = {
            scrollTop: scrollRef.current.scrollTop,
            scrollHeight: scrollRef.current.scrollHeight,
            clientHeight: scrollRef.current.clientHeight,
        };
        const maxScrollTop = Math.max(0, next.scrollHeight - next.clientHeight);
        if (next.scrollTop < 0 || next.scrollTop > maxScrollTop) {
            const corrected = Math.min(
                maxScrollTop,
                Math.max(0, next.scrollTop)
            );
            // eslint-disable-next-line no-console
            console.log('[CustomScrollbar] clamp onScroll', {
                before: next.scrollTop,
                after: corrected,
                maxScrollTop,
            });
            scrollRef.current.scrollTop = corrected;
            next.scrollTop = corrected;
        }
        debugLog('onScroll', next);
        setScrollState(next);
    }, []);

    const [dpr, setDpr] = useState(() => readDevicePixelRatio());
    const [viewportScale, setViewportScale] = useState(() => {
        const vv = readVisualViewport();
        return vv && typeof vv.scale === 'number' ? vv.scale : 1;
    });

    useEffect(() => {
        const update = () => {
            const nextDpr = readDevicePixelRatio();
            if (nextDpr !== dpr) setDpr(nextDpr);
            const vvNow = readVisualViewport();
            const nextScale =
                vvNow && typeof vvNow.scale === 'number' ? vvNow.scale : 1;
            if (nextScale !== viewportScale) setViewportScale(nextScale);
            if (scrollRef.current) {
                setScrollState({
                    scrollTop: scrollRef.current.scrollTop,
                    scrollHeight: scrollRef.current.scrollHeight,
                    clientHeight: scrollRef.current.clientHeight,
                });
            }
        };
        update();
        if (hasGlobalEventListeners()) {
            globalThis.addEventListener('resize', update);
            globalThis.addEventListener('orientationchange', update);
        }
        const vv = readVisualViewport();
        if (vv) {
            vv.addEventListener('resize', update);
            vv.addEventListener('scroll', update);
        }
        return () => {
            if (hasGlobalEventListeners()) {
                globalThis.removeEventListener('resize', update);
                globalThis.removeEventListener('orientationchange', update);
            }
            if (vv) {
                vv.removeEventListener('resize', update);
                vv.removeEventListener('scroll', update);
            }
        };
    }, [dpr, viewportScale]);

    useEffect(() => {
        if (
            !scrollRef.current ||
            (globalThis as Partial<typeof globalThis>).ResizeObserver ===
                undefined
        )
            return undefined;
        const ResizeObserverImpl = (
            globalThis as typeof globalThis & {
                ResizeObserver: typeof ResizeObserver;
            }
        ).ResizeObserver;
        const updateFromDom = () => {
            if (!scrollRef.current) return;
            setScrollState({
                scrollTop: scrollRef.current.scrollTop,
                scrollHeight: scrollRef.current.scrollHeight,
                clientHeight: scrollRef.current.clientHeight,
            });
        };
        const roContainer = new ResizeObserverImpl(updateFromDom);
        roContainer.observe(scrollRef.current);
        const contentEl = scrollRef.current
            .firstElementChild as HTMLElement | null;
        const roContent = contentEl
            ? new ResizeObserverImpl(updateFromDom)
            : undefined;
        if (roContent && contentEl) roContent.observe(contentEl);
        return () => {
            roContainer.disconnect();
            if (roContent) roContent.disconnect();
        };
    }, []);

    const matchMediaFn = getMatchMedia();
    const prefersReducedMotion = !!(
        matchMediaFn && matchMediaFn('(prefers-reduced-motion: reduce)').matches
    );

    const getThumbScale = () => {
        if (prefersReducedMotion) return 1;
        if (isDragging) return DRAG_SCALE;
        if (isHovered) return HOVER_SCALE;
        return 1;
    };
    const thumbScale = getThumbScale();
    const scaledThumbWidth = PERCEIVED_THUMB_WIDTH * thumbScale;
    const thumbWidth = Math.min(RAIL_THICKNESS - 0.5, scaledThumbWidth);

    const containerBorderThickness = getStaticBorderThickness(style);
    const visibleRadius = computeVisibleInnerRadius(
        containerRadius,
        containerBorderThickness
    );
    // Rail geometry is computed lazily where needed; no local variable required
    const thumbGeometry = buildThumbGeometry(visibleRadius, thumbWidth);

    const verticalLaneInset = RIM_CLEARANCE + ANTIALIAS_TOLERANCE;
    const rawClientH =
        scrollRef.current?.clientHeight ?? scrollState.clientHeight;
    const rectClientH = scrollRef.current?.getBoundingClientRect().height ?? 0;
    const liveClientHeight = rawClientH > 0 ? rawClientH : rectClientH;
    const rawScrollH =
        scrollRef.current?.scrollHeight ?? scrollState.scrollHeight;
    const childScrollH = scrollRef.current?.firstElementChild
        ? (scrollRef.current.firstElementChild as HTMLElement).scrollHeight
        : 0;
    const liveScrollHeight = rawScrollH > 0 ? rawScrollH : childScrollH;
    const effectiveLaneHeight = Math.max(
        0,
        liveClientHeight - 2 * verticalLaneInset
    );

    const hasScrollableContent = liveScrollHeight > liveClientHeight;

    const scaledClientHeight =
        viewportScale > 0
            ? scrollState.clientHeight / viewportScale
            : scrollState.clientHeight;
    const visibleRatio =
        liveScrollHeight > 0
            ? clamp(liveClientHeight / liveScrollHeight, 0, 1)
            : 1;
    // Exact fraction between content and viewport — this matches how scrolling clamps
    const exactThumbRatio = visibleRatio;

    const proportionalThumbHeight = effectiveLaneHeight * exactThumbRatio;

    const rawThumbHeight = Math.min(
        Math.max(THUMB_MIN_HEIGHT, proportionalThumbHeight),
        effectiveLaneHeight
    );

    const scrollableRange = Math.max(0, liveScrollHeight - liveClientHeight);

    const scrollRatio = hasScrollableContent
        ? scrollState.scrollTop / scrollableRange
        : 0;

    const maxThumbTravel = Math.max(0, effectiveLaneHeight - rawThumbHeight);
    const baseThumbTop = verticalLaneInset + scrollRatio * maxThumbTravel;

    // Distances not used in simplified static geometry

    // Simplified: no per-scroll intrusion; shape is computed from container only
    const sinkOffset = 0;
    const snappedThumbWidth = snapToPixel(thumbGeometry.paintWidth, dpr);
    const effectiveThumbHeight = Math.max(0, rawThumbHeight - 2 * sinkOffset);
    const thumbHeight = effectiveThumbHeight;

    const {
        railViewportWidth,
        railFillWidth,
        finalThumbWidth,
        finalThumbPaintRadius,
        thumbViewportWidth,
        thumbRightOffset,
        trackLeftRadiusPx,
        trackRightRadiusPx,
    } = useMemo(() => {
        // Exact-fit geometry: viewport spans inset + rail thickness
        const railViewportWidthLocal = snapToPixel(
            LANE_INSET + RAIL_THICKNESS,
            dpr
        );
        const railFillWidthLocal = snapToPixel(RAIL_THICKNESS, dpr);

        const finalThumbWidthLocal = snapToPixel(
            Math.min(snappedThumbWidth, railFillWidthLocal),
            dpr
        );
        const finalThumbPaintRadiusLocal = Math.min(
            finalThumbWidthLocal / 2,
            effectiveThumbHeight / 2
        );
        const thumbViewportWidthLocal = railViewportWidthLocal;
        const thumbRightOffsetRawLocal = Math.max(
            0,
            (railFillWidthLocal - finalThumbWidthLocal) / 2
        );
        const thumbRightOffsetLocal = snapToPixel(
            thumbRightOffsetRawLocal,
            dpr
        );
        // Exact-fit: right corners match container; left corners inset by viewport width
        const trackRightRadiusLocal = containerRadius;
        const trackLeftRadiusLocal = Math.max(
            0,
            containerRadius - railViewportWidthLocal
        );
        const trackRightRadiusPxLocal = snapToPixel(trackRightRadiusLocal, dpr);
        const trackLeftRadiusPxLocal = snapToPixel(trackLeftRadiusLocal, dpr);

        return {
            railViewportWidth: railViewportWidthLocal,
            railFillWidth: railFillWidthLocal,
            finalThumbWidth: finalThumbWidthLocal,
            finalThumbPaintRadius: finalThumbPaintRadiusLocal,
            thumbViewportWidth: thumbViewportWidthLocal,
            thumbRightOffset: thumbRightOffsetLocal,
            trackLeftRadiusPx: trackLeftRadiusPxLocal,
            trackRightRadiusPx: trackRightRadiusPxLocal,
        };
        // Recompute when container radius or thumb paint width changes
    }, [dpr, snappedThumbWidth, effectiveThumbHeight, containerRadius]);

    // CSS-pixel geometry using exact scroll fraction; then snap to device pixels
    const laneTop = verticalLaneInset;
    const liveScrollTop = scrollRef.current?.scrollTop ?? scrollState.scrollTop;
    const liveScrollRangeCss = Math.max(0, liveScrollHeight - liveClientHeight);
    const exactScrollRatioCss =
        liveScrollRangeCss > 0
            ? clamp(liveScrollTop / liveScrollRangeCss, 0, 1)
            : 0;

    // Compute snapped height first, then derive travel from snapped height
    const cssThumbFullHeightRaw = Math.min(
        Math.max(THUMB_MIN_HEIGHT, effectiveLaneHeight * exactThumbRatio),
        effectiveLaneHeight
    );
    const snappedThumbHeight = snapToPixel(cssThumbFullHeightRaw, dpr);
    const measuredViewportHeight =
        'document' in globalThis
            ? thumbViewportRef.current?.getBoundingClientRect().height ?? 0
            : 0;
    const viewportHeightForTravel =
        measuredViewportHeight > 0
            ? measuredViewportHeight
            : effectiveLaneHeight;
    const cssAvailableTravel = Math.max(
        0,
        viewportHeightForTravel - snappedThumbHeight
    );
    const cssThumbTopRaw = laneTop + exactScrollRatioCss * cssAvailableTravel;
    // Snap and clamp in CSS px using device-pixel rounding with the same travel
    const snappedThumbTop = snapToPixel(cssThumbTopRaw, dpr);
    const clampedThumbTopCss = clamp(
        snappedThumbTop,
        laneTop,
        laneTop + cssAvailableTravel
    );
    const inViewportTop = Math.max(0, clampedThumbTopCss - laneTop);
    const maxTopCss = Math.max(0, viewportHeightForTravel - snappedThumbHeight);
    const boundedTopCss = clamp(inViewportTop, 0, maxTopCss);
    const renderedThumbHeight = Math.min(
        snappedThumbHeight,
        viewportHeightForTravel
    );

    useEffect(() => {
        debugLog('geom', {
            scrollState,
            live: {
                clientHeight: liveClientHeight,
                scrollHeight: liveScrollHeight,
            },
            effectiveLaneHeight,
            viewportScale,
            scaledClientHeight,
            visibleRatio,
            exactThumbRatio,
            rawThumbHeight,
            effectiveThumbHeight,
            maxThumbTravel,
            baseThumbTop,
            clampedThumbTopCss,
            thumbHeight,
            laneTop: verticalLaneInset,
            renderedThumbHeight,
            inViewportTop,
            boundedTopCss,
            maxTopCss,
            measuredViewportHeight,
            viewportHeightForTravel,
        });
    }, [
        scrollState,
        liveClientHeight,
        liveScrollHeight,
        effectiveLaneHeight,
        rawThumbHeight,
        effectiveThumbHeight,
        maxThumbTravel,
        baseThumbTop,
        thumbHeight,
        renderedThumbHeight,
        boundedTopCss,
        maxTopCss,
        viewportScale,
        scaledClientHeight,
        visibleRatio,
        exactThumbRatio,
        measuredViewportHeight,
        viewportHeightForTravel,
        clampedThumbTopCss,
        verticalLaneInset,
        inViewportTop,
    ]);

    useEffect(() => {
        debugLog('zoomMetrics', {
            dpr,
            viewportScale,
            clientHeight: scrollState.clientHeight,
            scrollHeight: scrollState.scrollHeight,
            rectClientH,
            liveClientHeight,
            liveScrollHeight,
            scaledClientHeight,
            visibleRatio,
            exactThumbRatio,
        });
    }, [
        dpr,
        viewportScale,
        scrollState.clientHeight,
        scrollState.scrollHeight,
        rectClientH,
        liveClientHeight,
        liveScrollHeight,
        scaledClientHeight,
        visibleRatio,
        exactThumbRatio,
    ]);

    const showScrollbar = hasScrollableContent;

    const highlightOpacity = clamp(0.2, 0.05, 0.2);

    const thumbOpacity = isHovered ? 0.88 : 0.78;
    const thumbBrightness = isDragging ? 1.03 : 1;
    const railChannelBrightness = isHovered || isDragging ? 1.2 : 1;

    const thumbPaintRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const el = thumbPaintRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        debugLog('thumbDOM', {
            expected: {
                effectiveLaneHeight,
                visibleRatio,
                exactThumbRatio,
                cssThumbFullHeight: Math.min(
                    Math.max(
                        THUMB_MIN_HEIGHT,
                        effectiveLaneHeight * exactThumbRatio
                    ),
                    effectiveLaneHeight
                ),
                renderedThumbHeight,
                boundedTopCss,
            },
            measured: {
                height: rect.height,
                top: rect.top,
            },
        });
    }, [
        effectiveLaneHeight,
        visibleRatio,
        renderedThumbHeight,
        boundedTopCss,
        exactThumbRatio,
    ]);

    const handleThumbMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsDragging(true);
            dragStartRef.current = {
                y: e.clientY,
                scrollTop: scrollState.scrollTop,
            };
        },
        [scrollState.scrollTop]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !scrollRef.current) return;
            const deltaY = e.clientY - dragStartRef.current.y;
            const scrollableHeight = Math.max(
                0,
                (scrollRef.current?.scrollHeight ?? scrollState.scrollHeight) -
                    (scrollRef.current?.clientHeight ??
                        scrollState.clientHeight)
            );
            const availableThumbTravel = Math.max(
                0,
                effectiveLaneHeight - thumbHeight
            );
            const dragScrollMapping =
                availableThumbTravel > 0
                    ? scrollableHeight / availableThumbTravel
                    : 0;
            const nextScrollTop =
                dragStartRef.current.scrollTop + deltaY * dragScrollMapping;
            const clampedNext = clamp(nextScrollTop, 0, scrollableHeight);
            debugLog('drag', {
                deltaY,
                scrollableHeight,
                availableThumbTravel,
                dragScrollMapping,
                nextScrollTop,
                clampedNext,
            });
            scrollRef.current.scrollTop = clampedNext;
        },
        [isDragging, scrollState, effectiveLaneHeight, thumbHeight]
    );

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!scrollRef.current) return;
            const step = scrollState.clientHeight * 0.1;
            const maxScrollTop = Math.max(
                0,
                scrollState.scrollHeight - scrollState.clientHeight
            );

            switch (e.key) {
                case 'ArrowUp': {
                    e.preventDefault();
                    const before = scrollRef.current.scrollTop;
                    const after = Math.max(0, before - step);
                    debugLog('key ArrowUp', { before, after, maxScrollTop });
                    scrollRef.current.scrollTop = after;
                    break;
                }
                case 'ArrowDown': {
                    e.preventDefault();
                    const before = scrollRef.current.scrollTop;
                    const after = Math.min(maxScrollTop, before + step);
                    debugLog('key ArrowDown', { before, after, maxScrollTop });
                    scrollRef.current.scrollTop = after;
                    break;
                }
                case 'PageUp': {
                    e.preventDefault();
                    const before = scrollRef.current.scrollTop;
                    const after = Math.max(
                        0,
                        before - scrollState.clientHeight
                    );
                    debugLog('key PageUp', { before, after, maxScrollTop });
                    scrollRef.current.scrollTop = after;
                    break;
                }
                case 'PageDown': {
                    e.preventDefault();
                    const before = scrollRef.current.scrollTop;
                    const after = Math.min(
                        maxScrollTop,
                        before + scrollState.clientHeight
                    );
                    debugLog('key PageDown', { before, after, maxScrollTop });
                    scrollRef.current.scrollTop = after;
                    break;
                }
                case 'Home': {
                    e.preventDefault();
                    debugLog('key Home');
                    scrollRef.current.scrollTop = 0;
                    break;
                }
                case 'End': {
                    e.preventDefault();
                    debugLog('key End', { to: maxScrollTop });
                    scrollRef.current.scrollTop = maxScrollTop;
                    break;
                }
                default: {
                    break;
                }
            }
        },
        [scrollState]
    );

    useEffect(() => {
        if (!isDragging) return undefined;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    useEffect(() => {
        handleScroll();
    }, [handleScroll, children, dpr, viewportScale]);

    if (Platform.OS !== 'web') {
        return null;
    }

    const primary = theme.colors.Primary;

    // Respect caller-provided paddings while reserving space for the custom scrollbar lane.
    // We explicitly compute numeric paddings from the provided contentContainerStyle to
    // avoid RN Web shorthand precedence issues (paddingHorizontal vs paddingLeft/Right).
    type PaddingStyle = {
        paddingLeft?: unknown;
        paddingRight?: unknown;
        paddingHorizontal?: unknown;
    };
    const ccs = (contentContainerStyle as PaddingStyle) ?? {};
    const rawPaddingLeft = ccs.paddingLeft;
    const rawPaddingRight = ccs.paddingRight;
    const rawPaddingHorizontal = ccs.paddingHorizontal;
    const basePaddingLeft =
        toNumericPx(rawPaddingLeft ?? rawPaddingHorizontal) ?? 0;
    const basePaddingRight =
        toNumericPx(rawPaddingRight ?? rawPaddingHorizontal) ?? 0;

    const thumbAriaProps = {
        role: 'scrollbar',
        'aria-controls': nativeID,
        'aria-valuenow': Math.round(scrollRatio * 100),
        'aria-valuemin': 0,
        'aria-valuemax': 100,
        'aria-orientation': 'vertical' as const,
    };

    return (
        <div
            role="none"
            style={{
                position: 'relative',
                ...(maxHeight !== undefined
                    ? { maxHeight }
                    : { height: '100%', minHeight: 0 }),
                overflow: 'hidden',
                borderRadius: containerRadius,
                ...style,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <style>
                {`
                    @media (prefers-reduced-motion: reduce) {
                        .custom-scrollbar-thumb,
                        .custom-scrollbar-thumb > div,
                        .custom-scrollbar-thumb *,
                        .custom-scrollbar-track {
                            transition: none !important;
                        }
                    }
                    @media (forced-colors: active) {
                        .custom-scrollbar-track {
                            border: 1px solid CanvasText;
                        }
                        .custom-scrollbar-thumb {
                            background: LinkText !important;
                            box-shadow: none !important;
                        }
                    }
                `}
            </style>
            <div
                ref={scrollRef}
                id={nativeID}
                onScroll={handleScroll}
                style={{
                    ...(maxHeight !== undefined
                        ? { maxHeight }
                        : { height: '100%', minHeight: 0 }),
                    overflow: 'auto',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <View
                    style={{
                        overflow: 'hidden',
                        borderRadius: containerRadius,
                        ...contentContainerStyle,
                        // Ensure left/right paddings include our reserved gutters
                        paddingLeft: basePaddingLeft + CONTENT_MIRROR_GUTTER,
                        paddingRight:
                            basePaddingRight + LANE_INSET + LANE_WIDTH,
                    }}
                >
                    {children}
                </View>
            </div>
            {showScrollbar && (
                <>
                    <div
                        className="custom-scrollbar-track"
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            width: railViewportWidth,
                            pointerEvents: 'none',
                            overflow: 'hidden',
                            borderTopLeftRadius: trackLeftRadiusPx,
                            borderTopRightRadius: trackRightRadiusPx,
                            borderBottomRightRadius: trackRightRadiusPx,
                            borderBottomLeftRadius: trackLeftRadiusPx,
                            zIndex: 0,
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                top: verticalLaneInset,
                                bottom: verticalLaneInset,
                                right: 0,
                                width: railFillWidth,
                                background: toRgba(primary, 0.12),
                                WebkitMaskImage: undefined,
                                maskImage: undefined,
                                borderRadius: `${trackLeftRadiusPx}px 0 0 ${trackLeftRadiusPx}px`,
                                boxShadow: `
                                    inset 0 0 8px ${toRgba(primary, (isHovered || isDragging ? 0.25 : 0.15) * railChannelBrightness)},
                                    inset 0 0 16px ${toRgba(primary, (isHovered || isDragging ? 0.15 : 0.08) * railChannelBrightness)},
                                    inset 0 1px 2px ${toRgba(theme.colors.ActiveText, 0.1)},
                                    0 0 0 0.5px ${toRgba(primary, 0.2)}
                                `,
                                opacity: 0.85,
                                transition:
                                    'opacity 0.12s ease-out, box-shadow 0.12s ease-out',
                                pointerEvents: 'none',
                            }}
                        />
                    </div>
                    {(isHovered || isDragging) && (
                        <div
                            style={{
                                position: 'absolute',
                                top: `${verticalLaneInset + boundedTopCss}px`,
                                right: `${thumbRightOffset}px`,
                                width: `${finalThumbWidth}px`,
                                height: `${renderedThumbHeight}px`,
                                pointerEvents: 'none',
                                zIndex: 0,
                            }}
                        >
                            <Glow
                                color={primary}
                                borderRadius={finalThumbPaintRadius}
                                focal={{ x: 0.5, y: 0.5 }}
                                opacity={isDragging ? 0.6 : 0.4}
                                animate
                                fillContainer
                            />
                        </div>
                    )}
                    <div
                        className="custom-scrollbar-thumb"
                        onMouseDown={handleThumbMouseDown}
                        onKeyDown={handleKeyDown}
                        {...thumbAriaProps}
                        tabIndex={0}
                        style={{
                            position: 'absolute',
                            top: verticalLaneInset,
                            right: 0,
                            bottom: verticalLaneInset,
                            width: thumbViewportWidth,
                            overflow: 'hidden',
                            clipPath: `inset(0px 0px 0px 0px round ${trackRightRadiusPx}px)`,
                            borderTopLeftRadius: 0,
                            borderTopRightRadius: trackRightRadiusPx,
                            borderBottomRightRadius: trackRightRadiusPx,
                            borderBottomLeftRadius: 0,
                            pointerEvents: 'auto',
                            zIndex: 1,
                            cursor: isDragging ? 'grabbing' : 'grab',
                            touchAction: 'none',
                        }}
                        ref={thumbViewportRef}
                    >
                        <div
                            className="custom-scrollbar-thumb-carrier"
                            style={{
                                position: 'absolute',
                                top: 0,
                                right: thumbRightOffset,
                                bottom: 0,
                                width: finalThumbWidth,
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 0,
                                borderBottomRightRadius: 0,
                                borderBottomLeftRadius: 0,
                                overflow: 'hidden',
                                pointerEvents: 'none',
                                transition:
                                    'right 0.12s ease-out, width 0.12s ease-out',
                            }}
                        >
                            <div
                                ref={thumbPaintRef}
                                style={{
                                    position: 'absolute',
                                    top: boundedTopCss,
                                    right: 0,
                                    width: '100%',
                                    height: renderedThumbHeight,
                                    background: primary,
                                    borderTopLeftRadius: finalThumbPaintRadius,
                                    borderTopRightRadius: finalThumbPaintRadius,
                                    borderBottomRightRadius:
                                        finalThumbPaintRadius,
                                    borderBottomLeftRadius:
                                        finalThumbPaintRadius,
                                    boxShadow: `inset 0 0 0 1px ${toRgba(theme.colors.ActiveText, highlightOpacity)}`,
                                    opacity: thumbOpacity,
                                    filter: `brightness(${thumbBrightness})`,
                                    transition:
                                        'top 0.12s ease-out, border-radius 0.12s ease-out, opacity 0.12s ease-out, filter 0.12s ease-out',
                                    pointerEvents: 'none',
                                }}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export const NexusScrollView: React.FC<NexusScrollViewProps> = (props) => {
    if (Platform.OS !== 'web') {
        const {
            children,
            style,
            contentContainerStyle,
            nativeID,
            maxHeight,
            containerRadius = BorderRadius.Small,
            keyboardShouldPersistTaps,
            scrollEventThrottle,
        } = props;
        return (
            <ScrollView
                nativeID={nativeID}
                style={{
                    ...(maxHeight !== undefined ? { maxHeight } : {}),
                    borderRadius: containerRadius,
                    ...(style as Record<string, unknown>),
                }}
                contentContainerStyle={
                    contentContainerStyle as Record<string, unknown>
                }
                keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                scrollEventThrottle={scrollEventThrottle}
            >
                <View style={{ borderRadius: containerRadius }}>
                    {children}
                </View>
            </ScrollView>
        );
    }
    return <WebNexusScrollView {...props} />;
};
