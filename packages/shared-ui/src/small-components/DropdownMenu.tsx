import React, { useState, useMemo } from 'react';
import { View, Pressable, StyleSheet, useWindowDimensions } from 'react-native';

import { useTheme, Theme } from '../theme';

export type RawRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type DropdownMenuProps = {
    rawRect: RawRect;
    onDismiss: () => void;
    children: React.ReactNode;
    onLayoutChange?: (layout: { width: number; height: number }) => void;
};

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
    rawRect,
    onDismiss,
    children,
    onLayoutChange,
}) => {
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const [dropdownLayout, setDropdownLayout] = useState<
        | {
              width: number;
              height: number;
          }
        | undefined
    >();
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    // Default positioning: align dropdown's top left with the more button's bottom left.
    let finalLeft = rawRect.x;
    let finalTop = rawRect.y + rawRect.height;

    if (dropdownLayout) {
        // Horizontal adjustment:
        // If the dropdown overflows to the right, snap so its right edge aligns with the more button's right edge.
        if (finalLeft + dropdownLayout.width > windowWidth) {
            const potentialLeft =
                rawRect.x + rawRect.width - dropdownLayout.width;
            finalLeft = potentialLeft >= 0 ? potentialLeft : 0;
        }
        // Vertical adjustment:
        // If the dropdown overflows at the bottom, position it above the more button.
        if (finalTop + dropdownLayout.height > windowHeight) {
            const potentialTop = rawRect.y - dropdownLayout.height;
            finalTop =
                potentialTop >= 0
                    ? potentialTop
                    : windowHeight - dropdownLayout.height;
        }
    }

    return (
        <>
            <Pressable style={styles.dismissOverlay} onPress={onDismiss} />
            <View
                style={[
                    styles.dropdownMenu,
                    { top: finalTop, left: finalLeft },
                ]}
                onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    if (
                        !dropdownLayout ||
                        dropdownLayout.width !== width ||
                        dropdownLayout.height !== height
                    ) {
                        setDropdownLayout({ width, height });
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                        onLayoutChange && onLayoutChange({ width, height });
                    }
                }}
            >
                {children}
            </View>
        </>
    );
};

function createStyles(theme: Theme) {
    return StyleSheet.create({
        dismissOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
        },
        dropdownMenu: {
            position: 'absolute',
            backgroundColor: theme.colors.PrimaryBackground,
            padding: 8,
            borderRadius: 4,
            minWidth: 120,
            zIndex: 100,
            elevation: 10, // ensures proper stacking on Android
        },
    });
}
