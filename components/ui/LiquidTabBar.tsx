import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable, Text } from '@react-navigation/elements';
import { useLinkBuilder } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';

// Liquid glass tab bar with animated pill + blur background
export function LiquidTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { buildHref } = useLinkBuilder();
    const { isDark } = useTheme();
    const [layout, setLayout] = useState({ width: 0, height: 0 });
    const indicator = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const next = state.index * (itemWidth || 0);
        Animated.spring(indicator, {
            toValue: next,
            tension: 180,
            friction: 18,
            useNativeDriver: true,
        }).start();
    }, [state.index, indicator, layout.width]);

    const itemWidth = useMemo(() => {
        if (!layout.width || !state.routes.length) return 0;
        return layout.width / state.routes.length;
    }, [layout.width, state.routes.length]);

    const onLayout = (e: LayoutChangeEvent) => {
        setLayout(e.nativeEvent.layout);
    };

    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            <View style={[styles.container, {
                borderColor: isDark ? Colors.glass.border : 'rgba(0,0,0,0.1)',
            }]} onLayout={onLayout}>
                <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
                {itemWidth > 0 && (
                    <Animated.View
                        style={[
                            styles.indicator,
                            {
                                width: itemWidth - 20,
                                transform: [{ translateX: Animated.add(indicator, new Animated.Value(10)) }],
                                backgroundColor: isDark ? 'rgba(28,189,104,0.18)' : 'rgba(33,122,255,0.18)',
                                borderColor: isDark ? Colors.primary.green : Colors.primary.blue,
                            },
                        ]}
                    />
                )}
                <View style={styles.row}>
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

                        let iconName = 'circle';
                        if (route.name === 'index') iconName = 'globe.americas.fill';
                        if (route.name === 'discover') iconName = 'magnifyingglass';
                        if (route.name === 'community') iconName = 'person.2.fill';
                        if (route.name === 'profile') iconName = 'person.crop.circle.fill';

                        return (
                            <PlatformPressable
                                key={route.key}
                                href={buildHref(route.name, route.params)}
                                accessibilityState={isFocused ? { selected: true } : {}}
                                accessibilityLabel={options.tabBarAccessibilityLabel}
                                testID={(options as any).tabBarTestID}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                style={styles.tabItem}
                            >
                                <SymbolView
                                    name={iconName as any}
                                    size={24}
                                    tintColor={isFocused ? (isDark ? Colors.primary.green : Colors.primary.blue) : (isDark ? Colors.glass.textSecondary : Colors.light.icon)}
                                />
                                <Text
                                    style={[
                                        styles.label,
                                        {
                                            color: isFocused ? (isDark ? Colors.primary.green : Colors.primary.blue) : (isDark ? Colors.glass.textSecondary : Colors.light.icon),
                                        },
                                    ]}
                                >
                                    {typeof label === 'string' ? label : route.name}
                                </Text>
                            </PlatformPressable>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        paddingBottom: 12,
    },
    container: {
        height: 78,
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        width: '92%',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.24,
        shadowRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 4,
    },
    label: {
        fontSize: 11,
        fontWeight: '700',
    },
    indicator: {
        position: 'absolute',
        top: 10,
        bottom: 10,
        borderRadius: 22,
        borderWidth: 1,
    },
});
