import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';

export function PatchedFlashList<T>(props: FlashListProps<T>) {
    // eslint-disable-next-line consistent-return
    useEffect(() => {
        if (props.inverted && Platform.OS === 'web') {
            // Use nativeID to find the DOM element.
            // Ensure your FlashList has nativeID="chat-items"
            const node = document.querySelector('#chat-items');
            if (node) {
                const wheelHandler = (e: WheelEvent) => {
                    // Invert the wheel deltas
                    const deltaY = -e.deltaY;
                    const deltaX = -e.deltaX;
                    node.scrollBy({
                        top: deltaY,
                        left: deltaX,
                        behavior: 'auto',
                    });
                    e.preventDefault();
                };
                // @ts-expect-error web event
                node.addEventListener('wheel', wheelHandler, {
                    passive: false,
                });
                return () => {
                    // @ts-expect-error web event
                    node.removeEventListener('wheel', wheelHandler);
                };
            }
        }
    }, [props.inverted]);

    // Removed the ref prop to avoid forwarding it to internal components.
    return <FlashList {...props} nativeID="chat-items" />;
}
