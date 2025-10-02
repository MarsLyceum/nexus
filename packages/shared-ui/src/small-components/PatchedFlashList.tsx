// PatchedFlashList.tsx
import React, {
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
    useMemo,
} from 'react';
import { Platform } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';

// keep your eslint-disable if you like
// eslint-disable-next-line react/display-name
type PatchedFlashListProps<T> = FlashListProps<T> & {
    estimatedItemSize?: number;
    itemHeights?: Record<string, number>;
    keyExtractor: (item: T, index: number) => string;
};

const DEFAULT_ESTIMATED_ITEM_SIZE = 320;

// eslint-disable-next-line react/display-name
function PatchedFlashListInner<T>(
    {
        inverted,
        itemHeights,
        keyExtractor,
        estimatedItemSize,
        ...props
    }: PatchedFlashListProps<T>,
    ref: React.Ref<FlashList<T>>
) {
    const listRef = useRef<FlashList<T>>(null);
    // expose underlying FlashList methods to parent
    useImperativeHandle(ref, () => listRef.current!);

    const computedEstimatedItemSize = useMemo(() => {
        if (estimatedItemSize) {
            return estimatedItemSize;
        }
        if (!itemHeights) {
            return DEFAULT_ESTIMATED_ITEM_SIZE;
        }
        const heights = Object.values(itemHeights);
        if (heights.length === 0) {
            return DEFAULT_ESTIMATED_ITEM_SIZE;
        }
        const total = heights.reduce((sum, value) => sum + value, 0);
        return Math.ceil(total / heights.length);
    }, [estimatedItemSize, itemHeights]);

    useEffect(() => {
        if (inverted && Platform.OS === 'web') {
            const node = document.querySelector('#patched-flash-list');
            if (!node) {
                console.warn('[PatchedFlashList] no #patched-flash-list found');
                return;
            }

            let ticking = false;
            const wheelHandler = (e: WheelEvent) => {
                e.preventDefault();
                const deltaY = -e.deltaY;
                if (!ticking) {
                    globalThis.requestAnimationFrame(() => {
                        node.scrollBy({ top: deltaY, behavior: 'auto' });
                        ticking = false;
                    });
                    ticking = true;
                }
            };

            // @ts-expect-error DOM API
            node.addEventListener('wheel', wheelHandler, { passive: false });
            // eslint-disable-next-line consistent-return
            return () => {
                // @ts-expect-error DOM API
                node.removeEventListener('wheel', wheelHandler);
            };
        }
    }, [inverted]);

    return (
        <FlashList
            {...(props as FlashListProps<T>)}
            inverted={inverted}
            ref={listRef}
            nativeID="patched-flash-list"
            keyExtractor={keyExtractor}
            estimatedItemSize={computedEstimatedItemSize}
        />
    );
}

export const PatchedFlashList = forwardRef(PatchedFlashListInner) as <T>(
    props: PatchedFlashListProps<T> & { ref?: React.Ref<FlashList<T>> }
) => React.ReactElement | null;
