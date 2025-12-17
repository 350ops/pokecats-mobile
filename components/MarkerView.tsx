import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export type MarkerViewProps = {
    color: string;
    selected?: boolean;
    // Kept for API compatibility with callers, but not rendered visibly.
    glyph?: string;
    /**
     * Base diameter of the colored dot (in dp). Defaults to Apple Maps–like size.
     */
    size?: number;
};

export function MarkerView({
    color,
    selected = false,
    glyph = 'pawprint.fill',
    size = 18,
}: MarkerViewProps) {
    // Use glyph only for testID-style metadata so it's not unused, but do not render it visually.
    const markerId = glyph ? `marker-${glyph}` : undefined;

    const scale = useSharedValue(selected ? 1.1 : 1);

    useEffect(() => {
        scale.value = withSpring(selected ? 1.18 : 1, {
            damping: 18,
            stiffness: 260,
            mass: 0.6,
        });
    }, [selected, scale]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const dotSize = size;
    const haloSize = dotSize + 8;
    // Explicit dimensions help react-native-maps render custom markers correctly
    const wrapperSize = haloSize + 10;

    return (
        <View
            style={[styles.wrapper, { width: wrapperSize, height: wrapperSize }]}
            pointerEvents="none"
            testID={markerId}
        >
            {/* Ground shadow */}
            <View style={[styles.shadow, { width: haloSize * 0.9 }]} />

            {/* Halo + central dot */}
            <Animated.View style={[styles.haloWrapper, animatedStyle]}>
                <View
                    style={[
                        styles.halo,
                        {
                            width: haloSize,
                            height: haloSize,
                            borderRadius: haloSize / 2,
                            opacity: selected ? 1 : 0.9,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.dot,
                            {
                                width: dotSize,
                                height: dotSize,
                                borderRadius: dotSize / 2,
                                backgroundColor: color,
                            },
                        ]}
                    />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    shadow: {
        position: 'absolute',
        bottom: -4,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(0,0,0,0.25)',
        transform: [{ scaleY: 0.5 }],
    },
    haloWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    halo: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowOffset: { width: -1, height: 4 },
        shadowRadius: 1.6,
        elevation: 3,
    },
    dot: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
