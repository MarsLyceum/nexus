import { findNodeHandle, Platform, View } from 'react-native';

type MaybeDomRect = DOMRect | undefined;

const isElementCandidate = (candidate: unknown): candidate is Element =>
    candidate instanceof Element;

const hasBoundingClientRect = (
    candidate: unknown
): candidate is { getBoundingClientRect: () => DOMRect } =>
    typeof candidate === 'object' &&
    candidate !== null &&
    'getBoundingClientRect' in candidate &&
    typeof (candidate as { getBoundingClientRect?: unknown })
        .getBoundingClientRect === 'function';

const isRecord = (candidate: unknown): candidate is Record<string, unknown> =>
    typeof candidate === 'object' && candidate !== null;

const callIfFunction = <T>(value: unknown, context: unknown): T | undefined =>
    typeof value === 'function'
        ? (value as (this: unknown) => T).call(context)
        : undefined;

const nextCandidatesFromRecord = (
    candidate: Record<string, unknown>
): readonly unknown[] => {
    const baseCandidates = [callIfFunction(candidate.getNode, candidate)];

    const keyedCandidates = (
        [
            'node',
            'element',
            'current',
            '_component',
            'base',
            'ref',
            'root',
            'container',
        ] as const
    ).flatMap((key) => (key in candidate ? [candidate[key]] : []));

    return [...baseCandidates, ...keyedCandidates].filter(
        (value): value is unknown => value !== undefined
    );
};

const resolveElementCandidates = (
    candidate: unknown,
    visited: Set<unknown>
): Element | undefined => {
    if (
        candidate === undefined ||
        candidate === null ||
        visited.has(candidate)
    ) {
        return undefined;
    }

    visited.add(candidate);

    if (isElementCandidate(candidate) || hasBoundingClientRect(candidate)) {
        return candidate as Element;
    }

    if (!isRecord(candidate)) {
        return undefined;
    }

    return nextCandidatesFromRecord(candidate).reduce<Element | undefined>(
        (resolved, nextCandidate) =>
            resolved ?? resolveElementCandidates(nextCandidate, visited),
        undefined
    );
};

const getElementFromHandle = (view: View | null): Element | undefined => {
    const handle = view ? findNodeHandle(view) : null;
    if (typeof handle !== 'number') {
        return undefined;
    }

    const documentRef = globalThis.document;
    if (!documentRef) {
        return undefined;
    }

    const resolvedFromId = documentRef.getElementById(String(handle));
    if (resolvedFromId instanceof Element) {
        return resolvedFromId;
    }

    const selectors = [
        `[data-rn-id="${handle}"]`,
        `[data-rn-handle="${handle}"]`,
        `[data-node-handle="${handle}"]`,
    ];

    return selectors.reduce<Element | undefined>((found, selector) => {
        if (found) {
            return found;
        }
        const queried = documentRef.querySelector(selector);
        return queried instanceof Element ? queried : undefined;
    }, undefined);
};

const withRectCache = (
    element: Element | undefined,
    cache: React.MutableRefObject<DOMRect | null>
): MaybeDomRect => {
    if (!element) {
        return undefined;
    }

    const rect = element.getBoundingClientRect();
    if (
        Number.isFinite(rect.width) &&
        Number.isFinite(rect.height) &&
        rect.width > 0 &&
        rect.height > 0
    ) {
        cache.current = rect;
        return rect;
    }

    return cache.current ?? undefined;
};

export type HoverBoundsContext = {
    viewRef: React.RefObject<View>;
    fallbackRectRef: React.MutableRefObject<DOMRect | null>;
};

export const resolveHoverBounds = ({
    viewRef,
    fallbackRectRef,
}: HoverBoundsContext): MaybeDomRect => {
    if (Platform.OS !== 'web') {
        return undefined;
    }

    const visited = new Set<unknown>();
    const elementCandidates = [viewRef.current, viewRef.current?.props];

    const resolvedElement = elementCandidates.reduce<Element | undefined>(
        (resolved, candidate) =>
            resolved ?? resolveElementCandidates(candidate, visited),
        undefined
    );

    const rectFromResolved = withRectCache(resolvedElement, fallbackRectRef);
    if (rectFromResolved) {
        return rectFromResolved;
    }

    const rectFromHandle = withRectCache(
        getElementFromHandle(viewRef.current ?? null),
        fallbackRectRef
    );
    if (rectFromHandle) {
        return rectFromHandle;
    }

    return fallbackRectRef.current ?? undefined;
};

const createDomRect = (
    x: number,
    y: number,
    width: number,
    height: number
): DOMRect =>
    typeof DOMRect === 'function'
        ? new DOMRect(x, y, width, height)
        : ({
              x,
              y,
              width,
              height,
              top: y,
              bottom: y + height,
              left: x,
              right: x + width,
              toJSON: () => ({ x, y, width, height }),
          } as DOMRect);

export const measureNativeView = (
    viewRef: React.RefObject<View>,
    onMeasured: (rect: DOMRect) => void
): void => {
    const view = viewRef.current;
    if (!view || Platform.OS !== 'web') {
        return;
    }

    const handleMeasurement = (
        x: number,
        y: number,
        width: number,
        height: number
    ) => {
        onMeasured(createDomRect(x, y, width, height));
    };

    if ('measureInWindow' in view) {
        (
            view as unknown as {
                measureInWindow: (
                    callback: (
                        x: number,
                        y: number,
                        width: number,
                        height: number
                    ) => void
                ) => void;
            }
        ).measureInWindow(handleMeasurement);
        return;
    }

    if ('measure' in view) {
        (
            view as unknown as {
                measure: (
                    callback: (
                        x: number,
                        y: number,
                        width: number,
                        height: number,
                        pageX: number,
                        pageY: number
                    ) => void
                ) => void;
            }
        ).measure((_, __, width, height, pageX, pageY) => {
            handleMeasurement(pageX, pageY, width, height);
        });
    }
};
