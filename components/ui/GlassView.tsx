import { Colors } from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface GlassViewProps extends ViewProps {
    intensity?: number;
}

export function GlassView({ style, intensity = 50, children, ...props }: GlassViewProps) {
    return (
        <View style={[styles.container, style]} {...props}>
            <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.glass.background,
        borderRadius: 20,
        overflow: 'hidden',
        borderColor: Colors.glass.border,
        borderWidth: 1,
    },
    content: {
        // Ensure content is above the blur
        zIndex: 1,
        width: '100%',
        justifyContent: 'center',
    },
});
