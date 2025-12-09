import { View, Platform, StyleSheet, LayoutChangeEvent } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';

export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { buildHref } = useLinkBuilder();
    const [layout, setLayout] = useState({ width: 0, height: 0 });

    const onLayout = (e: LayoutChangeEvent) => {
        setLayout(e.nativeEvent.layout);
    }

    return (
        <View style={styles.container} onLayout={onLayout}>
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label =
                        options.tabBarLabel !== undefined
                            ? options.tabBarLabel
                            : options.title !== undefined
                                ? options.title
                                : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name, route.params);
                        }
                    };

                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };

                    // Icon mapping based on route name (assuming standard names)
                    let iconName = 'circle';
                    if (route.name === 'index') iconName = 'house.fill';
                    if (route.name === 'map') iconName = 'map.fill';
                    if (route.name === 'report') iconName = 'plus.circle.fill';
                    if (route.name === 'community') iconName = 'person.2.fill';
                    if (route.name === 'profile') iconName = 'person.crop.circle.fill';

                    // Use tabBarIcon if provided
                    // Note: In expo-router with tabs, we often pass tabBarIcon in options, but here we build a custom bar.
                    // We can access options.tabBarIcon but it requires invoking the function.
                    // For simplicity in this robust design, we enforce symbol names or mapping.

                    return (
                        <PlatformPressable
                            key={route.key}
                            href={buildHref(route.name, route.params)}
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={(options as any).tabBarTestID}
                            onPress={onPress}
                            onLongPress={onLongPress}
                            style={[styles.tabItem, isFocused && styles.tabItemFocused]}
                        >
                            <SymbolView
                                name={iconName as any}
                                size={24}
                                tintColor={isFocused ? Colors.primary.green : Colors.glass.textSecondary}
                            />
                            <Text style={[styles.label, { color: isFocused ? Colors.primary.green : Colors.glass.textSecondary }]}>
                                {typeof label === 'string' ? label : route.name}
                            </Text>
                        </PlatformPressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        borderColor: Colors.glass.border,
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    tabItemFocused: {
        // Add specific focused styles if needed
    },
    label: {
        fontSize: 10,
        marginTop: 4,
        fontWeight: '600',
    }
});
