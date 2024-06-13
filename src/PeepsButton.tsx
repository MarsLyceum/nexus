import React, { ReactNode, useState, useRef, useCallback } from 'react';
import {
    Animated,
    Pressable,
    ViewStyle,
    PressableAndroidRippleConfig,
} from 'react-native';

interface PeepsButtonProps {
    onPress: () => void;
    children: ReactNode;
    style?: ViewStyle | ViewStyle[];
    hoverStyle?: ViewStyle | ViewStyle[];
    rippleStyle?: PressableAndroidRippleConfig;
}

export const PeepsButton = ({
    onPress,
    children,
    style,
    hoverStyle = {
        backgroundColor: '#f0f0f0',
    },
    rippleStyle = { color: '#f0f0f0', borderless: true },
}: PeepsButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: 0.7,
            useNativeDriver: true,
        }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    }, [scale]);

    return (
        <Animated.View
            style={[style, { transform: [{ scale }] }, isHovered && hoverStyle]}
        >
            <Pressable
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
                onPress={onPress}
                onHoverIn={() => setIsHovered(true)}
                onHoverOut={() => setIsHovered(false)}
                android_ripple={rippleStyle}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
};
