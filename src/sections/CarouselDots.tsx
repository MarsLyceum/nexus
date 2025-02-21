import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

type CarouselDotsProps = {
    totalItems: number;
    currentIndex: number;
    containerStyle?: ViewStyle;
    dotStyle?: ViewStyle;
    activeDotStyle?: ViewStyle;
};

export const CarouselDots: React.FC<CarouselDotsProps> = ({
    totalItems,
    currentIndex,
    containerStyle,
    dotStyle,
    activeDotStyle,
}) => (
    <View style={[styles.dotsContainer, containerStyle]}>
        {Array.from({ length: totalItems }).map((_, index) => (
            <View
                key={index}
                style={[
                    styles.dot,
                    dotStyle,
                    currentIndex === index && styles.activeDot,
                    currentIndex === index && activeDotStyle,
                ]}
            />
        ))}
    </View>
);

const styles = StyleSheet.create({
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 5,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#888', // default inactive color
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: '#fff', // default active color
    },
});
