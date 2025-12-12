import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface GlassButtonProps extends PressableProps {
    title?: string;
    icon?: string;
    iconColor?: string;
    variant?: 'primary' | 'secondary' | 'glass';
}

export function GlassButton({ title, icon, iconColor, variant = 'glass', style, ...props }: GlassButtonProps) {
    const { isDark } = useTheme();
    const defaultIconColor = isDark ? Colors.glass.text : Colors.light.icon;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                variant === 'primary' && styles.primary,
                variant === 'secondary' && styles.secondary,
                variant === 'glass' && { borderColor: isDark ? Colors.glass.border : 'rgba(0,0,0,0.1)' },
                pressed && styles.pressed,
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
                            // @ts-ignore: expo-symbols might not have TS types set up perfectly in all environments yet or requires specific icon names
                            <SymbolView
                                name={icon}
                                tintColor={iconColor ?? defaultIconColor}
                                size={24}
                                style={title ? styles.icon : undefined}
                            />
                        )}
                        {title && <Text style={[styles.text, { color: isDark ? Colors.glass.text : Colors.light.text }]}>{title}</Text>}
                    </View>
                </>
            )}
        </Pressable>
    );
}


const styles = StyleSheet.create({
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
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    text: {
        color: Colors.glass.text,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    icon: {
        marginRight: 4,
    }
});
