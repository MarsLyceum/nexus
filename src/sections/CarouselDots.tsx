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
}) => {
    // If there are 5 or fewer items, show all the dots.
    if (totalItems <= 5) {
        return (
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
    }

    // For more than 5 items, we compute a window of 5 dots.
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    let start = currentIndex - halfWindow;
    // Adjust if the start is negative
    if (start < 0) {
        start = 0;
    }
    // Adjust if the window goes beyond the last image
    if (start + windowSize > totalItems) {
        start = totalItems - windowSize;
    }
    const end = start + windowSize - 1;

    // Build our dot components.
    const dots = [];

    // If not at the beginning, add a small left indicator.
    if (start > 0) {
        dots.push(<View key="left-indicator" style={styles.indicatorDot} />);
    }

    // Render the main window of 5 dots.
    for (let i = start; i <= end; i++) {
        dots.push(
            <View
                key={i}
                style={[
                    styles.dot,
                    dotStyle,
                    i === currentIndex && styles.activeDot,
                    i === currentIndex && activeDotStyle,
                ]}
            />
        );
    }

    // If not at the end, add a small right indicator.
    if (end < totalItems - 1) {
        dots.push(<View key="right-indicator" style={styles.indicatorDot} />);
    }

    return <View style={[styles.dotsContainer, containerStyle]}>{dots}</View>;
};

const styles = StyleSheet.create({
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 5,
    },
    // Main dot style: standard inactive appearance.
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#888', // default inactive color
        marginHorizontal: 3,
    },
    // Active dot style: changes the background color.
    activeDot: {
        backgroundColor: '#fff', // default active color
    },
    // Modified small indicator dot style: 50% larger and vertically centered.
    indicatorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#888',
        marginHorizontal: 3,
        alignSelf: 'center',
    },
});
