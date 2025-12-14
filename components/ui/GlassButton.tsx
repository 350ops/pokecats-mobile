import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import React, { useState } from 'react';
import { Platform, Pressable, PressableProps, StyleSheet, Text, View, ViewStyle } from 'react-native';

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

interface GlassButtonProps extends PressableProps {
    title?: string;
    icon?: string;
    iconColor?: string;
    variant?: 'primary' | 'secondary' | 'glass';
}

export function GlassButton({ title, icon, iconColor, variant = 'glass', style, disabled, ...props }: GlassButtonProps) {
    const { isDark } = useTheme();
    const [key, setKey] = useState(0);
    
    // Check if native liquid glass is available (iOS 26+)
    const useNativeLiquidGlass = Platform.OS === 'ios' && 
        ExpoGlassView && 
        isLiquidGlassAvailable && 
        isLiquidGlassAvailable();
    
    // For native liquid glass buttons, text should be semi-transparent
    // iOS 26 uses white semi-transparent text on light mode, dark on dark mode
    const nativeTextColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
    const nativeIconColor = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.75)';
    
    // Fallback colors for non-native
    const fallbackTextColor = variant === 'primary' || variant === 'secondary' 
        ? '#FFFFFF' 
        : (isDark ? Colors.glass.text : Colors.light.text);
    const fallbackIconColor = variant === 'primary' || variant === 'secondary'
        ? '#FFFFFF'
        : (isDark ? Colors.glass.text : Colors.light.icon);

    // Use native liquid glass for primary variant on iOS 26+
    if (useNativeLiquidGlass && variant === 'primary' && ExpoGlassView) {
        return (
            <Pressable
                disabled={disabled}
                style={({ pressed }) => [
                    styles.nativeContainer,
                    pressed && styles.pressed,
                    disabled && styles.disabled,
                    style as ViewStyle
                ]}
                {...props}
            >
                <ExpoGlassView 
                    key={key}
                    style={styles.nativeGlassInner}
                    glassEffectStyle="regular"
                    isInteractive={true}
                    tintColor={Colors.primary.blue}
                >
                    <View style={styles.content}>
                        {icon && (
                            <SymbolView
                                name={icon as any}
                                tintColor={iconColor ?? nativeIconColor}
                                size={22}
                                style={title ? styles.icon : undefined}
                            />
                        )}
                        {title && (
                            <Text style={[styles.nativeText, { color: nativeTextColor }]}>
                                {title}
                            </Text>
                        )}
                    </View>
                </ExpoGlassView>
            </Pressable>
        );
    }

    // Fallback for non-iOS or older iOS versions
    return (
        <Pressable
            disabled={disabled}
            style={({ pressed }) => [
                styles.container,
                variant === 'primary' && styles.primary,
                variant === 'secondary' && styles.secondary,
                variant === 'glass' && { borderColor: isDark ? Colors.glass.border : 'rgba(0,0,0,0.1)' },
                pressed && styles.pressed,
                disabled && styles.disabled,
                style as ViewStyle
            ]}
            {...props}
        >
            {({ pressed }) => (
                <>
                    {variant === 'glass' && (
                        <BlurView intensity={pressed ? 80 : 40} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                    )}
                    <View style={styles.content}>
                        {icon && (
                            <SymbolView
                                name={icon as any}
                                tintColor={iconColor ?? fallbackIconColor}
                                size={24}
                                style={title ? styles.icon : undefined}
                            />
                        )}
                        {title && (
                            <Text style={[styles.text, { color: fallbackTextColor }]}>
                                {title}
                            </Text>
                        )}
                    </View>
                </>
            )}
        </Pressable>
    );
}


const styles = StyleSheet.create({
    nativeContainer: {
        borderRadius: 30,
        overflow: 'hidden',
        height: 56,
    },
    nativeGlassInner: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        borderRadius: 30,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 30,
        overflow: 'hidden',
        height: 50,
        paddingHorizontal: 20,
        borderColor: Colors.glass.border,
        borderWidth: 1,
    },
    primary: {
        backgroundColor: Colors.primary.blue,
        borderColor: Colors.primary.blue,
    },
    secondary: {
        backgroundColor: Colors.primary.green,
        borderColor: Colors.primary.green,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    disabled: {
        opacity: 0.5,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    nativeText: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 8,
    },
    icon: {
        marginRight: 4,
    }
});
