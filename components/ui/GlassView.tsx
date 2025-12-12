import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';

type GlassStyle = 'clear' | 'regular';

interface GlassViewProps extends ViewProps {
    /**
     * Fallback blur intensity (used on platforms / OS versions where `expo-glass-effect` isn't available).
     */
    intensity?: number;
    /**
     * iOS (expo-glass-effect): Glass style.
     */
    glassEffectStyle?: GlassStyle;
    /**
     * iOS (expo-glass-effect): Optional tint color for the glass.
     */
    tintColor?: string;
    /**
     * iOS (expo-glass-effect): Whether the glass effect should be interactive.
     *
     * NOTE (expo-glass-effect): This prop can only be set once on mount; to toggle it you must remount with a different `key`.
     * See docs: https://docs.expo.dev/versions/latest/sdk/glass-effect/
     */
    isInteractive?: boolean;
}

export function GlassView({
    style,
    intensity = 50,
    glassEffectStyle = 'regular',
    tintColor,
    isInteractive = false,
    children,
    ...props
}: GlassViewProps) {
    const { isDark } = useTheme();

    // IMPORTANT:
    // If the current dev client / native build does not include `expo-glass-effect`,
    // importing it at module scope will crash with:
    //   "Cannot find native module 'ExpoGlassEffect'"
    // So we load it lazily and fall back to `expo-blur` when not present.
    let ExpoGlassView:
        | undefined
        | React.ComponentType<{
              glassEffectStyle?: GlassStyle;
              tintColor?: string;
              isInteractive?: boolean;
              style?: any;
              children?: React.ReactNode;
          }>;
    let isLiquidGlassAvailable: undefined | (() => boolean);

    if (Platform.OS === 'ios') {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const mod = require('expo-glass-effect') as {
                GlassView: typeof ExpoGlassView;
                isLiquidGlassAvailable: () => boolean;
            };
            ExpoGlassView = mod.GlassView;
            isLiquidGlassAvailable = mod.isLiquidGlassAvailable;
        } catch {
            // Native module not present in this build — fall back.
            ExpoGlassView = undefined;
            isLiquidGlassAvailable = undefined;
        }
    }

    const NativeGlassView = ExpoGlassView;
    let nativeGlassAvailable = false;
    if (Platform.OS === 'ios' && typeof isLiquidGlassAvailable === 'function') {
        try {
            // If the native module isn't present in this build, this call can throw.
            nativeGlassAvailable = isLiquidGlassAvailable();
        } catch {
            nativeGlassAvailable = false;
        }
    }

    const canUseNativeGlass = Platform.OS === 'ios' && !!NativeGlassView && nativeGlassAvailable;
    const resolvedTintColor = tintColor ?? (isDark ? '#171717' : '#FFFFFF');

    // `expo-glass-effect` known issue: `isInteractive` cannot be changed after mount.
    // We force a remount when it changes.
    const interactiveKey = isInteractive ? 'interactive' : 'non-interactive';

    if (canUseNativeGlass && NativeGlassView) {
        return (
            <NativeGlassView
                key={interactiveKey}
                glassEffectStyle={glassEffectStyle}
                tintColor={resolvedTintColor}
                isInteractive={isInteractive}
                style={[
                    styles.container,
                    {
                        // Keep our existing border styling for consistent look.
                        borderColor: isDark ? Colors.glass.border : 'rgba(0, 0, 0, 0.1)',
                    },
                    style,
                ]}
                {...props}
            >
                {children}
            </NativeGlassView>
        );
    }

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
