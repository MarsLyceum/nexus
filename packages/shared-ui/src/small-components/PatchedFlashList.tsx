// PatchedFlashList.tsx
import React, {
    useEffect,
    useRef,
    useImperativeHandle,
    forwardRef,
} from 'react';
import { Platform } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';

// keep your eslint-disable if you like
// eslint-disable-next-line react/display-name
function PatchedFlashListInner<T>(
    { inverted, ...props }: FlashListProps<T>,
    ref: React.Ref<FlashList<T>>
) {
    const listRef = useRef<FlashList<T>>(null);
    // expose underlying FlashList methods to parent
    useImperativeHandle(ref, () => listRef.current!);

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
        />
    );
}

export const PatchedFlashList = forwardRef(PatchedFlashListInner) as <T>(
    props: FlashListProps<T> & { ref?: React.Ref<FlashList<T>> }
) => React.ReactElement | null;
