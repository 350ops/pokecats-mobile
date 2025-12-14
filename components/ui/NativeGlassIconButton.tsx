import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, Pressable, PressableProps, StyleSheet, View, ViewStyle } from 'react-native';

// Try to import expo-glass-effect for native liquid glass on iOS 26+
let ExpoGlassView: React.ComponentType<any> | null = null;
let isLiquidGlassAvailable: (() => boolean) | null = null;

try {
    const glassModule = require('expo-glass-effect');
    ExpoGlassView = glassModule.GlassView;
    isLiquidGlassAvailable = glassModule.isLiquidGlassAvailable;
} catch {
    // expo-glass-effect not available, will use fallback
}

interface NativeGlassIconButtonProps extends Omit<PressableProps, 'children'> {
    icon: string;
    size?: number;
    iconSize?: number;
    tintColor?: string;
}

/**
 * A native iOS 26 liquid glass icon button.
 * Uses the actual native UIVisualEffectView with isInteractive for the liquid glass animation.
 * Falls back to BlurView on older iOS versions and other platforms.
 */
export function NativeGlassIconButton({ 
    icon, 
    size = 40, 
    iconSize = 20,
    tintColor,
    style, 
    disabled,
    ...props 
}: NativeGlassIconButtonProps) {
    const { isDark } = useTheme();
    
    // Check if native liquid glass is available (iOS 26+)
    const useNativeLiquidGlass = Platform.OS === 'ios' && 
        ExpoGlassView && 
        isLiquidGlassAvailable && 
        isLiquidGlassAvailable();
    
    // Default tint colors for native liquid glass
    // iOS 26 uses semi-transparent colors
    const defaultTintColor = isDark 
        ? 'rgba(255,255,255,0.85)' 
        : 'rgba(0,0,0,0.6)';
    
    const finalTintColor = tintColor ?? defaultTintColor;
    
    const buttonStyle: ViewStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    // Use native liquid glass on iOS 26+
    if (useNativeLiquidGlass && ExpoGlassView) {
        return (
            <Pressable
                disabled={disabled}
                style={({ pressed }) => [
                    styles.pressable,
                    buttonStyle,
                    pressed && styles.pressed,
                    disabled && styles.disabled,
                    style as ViewStyle
                ]}
                {...props}
            >
                <ExpoGlassView 
                    style={[styles.nativeGlass, buttonStyle]}
                    glassEffectStyle="regular"
                    isInteractive={true}
                >
                    <SymbolView
                        name={icon as any}
                        tintColor={finalTintColor}
                        size={iconSize}
                    />
                </ExpoGlassView>
            </Pressable>
        );
    }

    // Fallback for non-iOS or older iOS versions
    return (
        <Pressable
            disabled={disabled}
            style={({ pressed }) => [
                styles.pressable,
                buttonStyle,
                pressed && styles.pressed,
                disabled && styles.disabled,
                style as ViewStyle
            ]}
            {...props}
        >
            <View style={[styles.fallbackContainer, buttonStyle]}>
                <BlurView 
                    intensity={60} 
                    tint={isDark ? "dark" : "light"} 
                    style={StyleSheet.absoluteFill} 
                />
                <View style={styles.iconContainer}>
                    <SymbolView
                        name={icon as any}
                        tintColor={tintColor ?? (isDark ? Colors.glass.text : Colors.light.text)}
                        size={iconSize}
                    />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    pressable: {
        overflow: 'hidden',
    },
    nativeGlass: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    disabled: {
        opacity: 0.5,
    },
    fallbackContainer: {
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

