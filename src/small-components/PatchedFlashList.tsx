// PatchedFlashList.tsx
import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { FlashList, FlashListProps } from '@shopify/flash-list';

export function PatchedFlashList<T>(props: FlashListProps<T>) {
    const flashListRef = useRef<FlashList<T>>(null);

    // eslint-disable-next-line consistent-return
    useEffect(() => {
        // Only run on web
        if (props.inverted && Platform.OS === 'web' && flashListRef.current) {
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
                node.addEventListener('wheel', wheelHandler, {
                    passive: false,
                });
                return () => {
                    node.removeEventListener('wheel', wheelHandler);
                };
            }
        }
    }, []);

    return <FlashList {...props} ref={flashListRef} nativeID="chat-items" />;
}
