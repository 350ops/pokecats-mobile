import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

interface GlassViewProps extends ViewProps {
    intensity?: number;
}

export function GlassView({ style, intensity = 50, children, ...props }: GlassViewProps) {
    const { isDark } = useTheme();

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: isDark ? Colors.glass.background : 'rgba(255, 255, 255, 0.6)',
                borderColor: isDark ? Colors.glass.border : 'rgba(0, 0, 0, 0.1)'
            },
            style
        ]} {...props}>
            <BlurView intensity={intensity} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
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
