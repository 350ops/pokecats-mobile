import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import React, { useCallback, useState } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

type SFSymbolName = ComponentProps<typeof SymbolView>['name'];

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type MenuItemVariant = 'default' | 'destructive' | 'disabled' | 'selected';

export interface MenuItem {
    id: string;
    title: string;
    subtitle?: string;
    icon?: SFSymbolName;
    variant?: MenuItemVariant;
    onPress?: () => void;
    rightIcon?: SFSymbolName;
    rightText?: string;
}

export interface MenuSection {
    id: string;
    title?: string;
    items: MenuItem[];
}

export interface VisionOSMenuProps {
    visible: boolean;
    onClose: () => void;
    sections: MenuSection[];
    anchor?: { x: number; y: number };
    title?: string;
    style?: ViewStyle;
}

export interface VisionOSMenuItemProps {
    item: MenuItem;
    onPress?: () => void;
    isFirst?: boolean;
    isLast?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Menu Item Component
// ─────────────────────────────────────────────────────────────

export function VisionOSMenuItem({ item, onPress, isFirst, isLast }: VisionOSMenuItemProps) {
    const { isDark } = useTheme();
    const [pressed, setPressed] = useState(false);

    const isDisabled = item.variant === 'disabled';
    const isDestructive = item.variant === 'destructive';
    const isSelected = item.variant === 'selected';

    const getTextColor = () => {
        if (isDisabled) return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        if (isDestructive) return '#FF453A';
        if (isSelected) return Colors.primary.green;
        return isDark ? Colors.glass.text : Colors.light.text;
    };

    const getIconColor = () => {
        if (isDisabled) return isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        if (isDestructive) return '#FF453A';
        if (isSelected) return Colors.primary.green;
        return isDark ? Colors.glass.textSecondary : Colors.light.icon;
    };

    const handlePress = useCallback(() => {
        if (!isDisabled && onPress) {
            onPress();
        }
        if (!isDisabled && item.onPress) {
            item.onPress();
        }
    }, [isDisabled, onPress, item]);

    return (
        <Pressable
            onPressIn={() => setPressed(true)}
            onPressOut={() => setPressed(false)}
            onPress={handlePress}
            disabled={isDisabled}
            style={[
                styles.menuItem,
                pressed && !isDisabled && styles.menuItemPressed,
                isFirst && styles.menuItemFirst,
                isLast && styles.menuItemLast,
                {
                    backgroundColor: pressed && !isDisabled
                        ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)')
                        : 'transparent',
                },
            ]}
        >
            {item.icon && (
                <View style={styles.iconContainer}>
                    <SymbolView
                        name={item.icon}
                        size={20}
                        tintColor={getIconColor()}
                    />
                </View>
            )}

            <View style={styles.textContainer}>
                <Text
                    style={[
                        styles.menuItemTitle,
                        { color: getTextColor() },
                    ]}
                    numberOfLines={1}
                >
                    {item.title}
                </Text>
                {item.subtitle && (
                    <Text
                        style={[
                            styles.menuItemSubtitle,
                            { color: isDark ? Colors.glass.textSecondary : Colors.light.icon },
                        ]}
                        numberOfLines={1}
                    >
                        {item.subtitle}
                    </Text>
                )}
            </View>

            {(item.rightIcon || item.rightText || isSelected) && (
                <View style={styles.rightContainer}>
                    {item.rightText && (
                        <Text
                            style={[
                                styles.rightText,
                                { color: isDark ? Colors.glass.textSecondary : Colors.light.icon },
                            ]}
                        >
                            {item.rightText}
                        </Text>
                    )}
                    {item.rightIcon && (
                        <SymbolView
                            name={item.rightIcon}
                            size={16}
                            tintColor={isDark ? Colors.glass.textSecondary : Colors.light.icon}
                        />
                    )}
                    {isSelected && !item.rightIcon && (
                        <SymbolView
                            name="checkmark"
                            size={16}
                            tintColor={Colors.primary.green}
                        />
                    )}
                </View>
            )}
        </Pressable>
    );
}

// ─────────────────────────────────────────────────────────────
// Menu Divider Component
// ─────────────────────────────────────────────────────────────

export function VisionOSMenuDivider() {
    const { isDark } = useTheme();
    return (
        <View
            style={[
                styles.divider,
                {
                    backgroundColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.1)',
                },
            ]}
        />
    );
}

// ─────────────────────────────────────────────────────────────
// Menu Section Component
// ─────────────────────────────────────────────────────────────

export function VisionOSMenuSection({
    section,
    onItemPress,
    isLastSection,
}: {
    section: MenuSection;
    onItemPress?: () => void;
    isLastSection?: boolean;
}) {
    const { isDark } = useTheme();

    return (
        <View style={styles.section}>
            {section.title && (
                <Text
                    style={[
                        styles.sectionTitle,
                        { color: isDark ? Colors.glass.textSecondary : Colors.light.icon },
                    ]}
                >
                    {section.title.toUpperCase()}
                </Text>
            )}
            <View style={styles.sectionItems}>
                {section.items.map((item, index) => (
                    <VisionOSMenuItem
                        key={item.id}
                        item={item}
                        onPress={onItemPress}
                        isFirst={index === 0}
                        isLast={index === section.items.length - 1}
                    />
                ))}
            </View>
            {!isLastSection && <VisionOSMenuDivider />}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────
// Main Menu Component (Modal)
// ─────────────────────────────────────────────────────────────

export function VisionOSMenu({
    visible,
    onClose,
    sections,
    title,
    style,
}: VisionOSMenuProps) {
    const { isDark } = useTheme();
    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 8,
                    tension: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, fadeAnim, scaleAnim]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Animated.View
                    style={[
                        styles.menuContainer,
                        style,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <BlurView
                        intensity={isDark ? 80 : 90}
                        tint={isDark ? 'dark' : 'light'}
                        style={StyleSheet.absoluteFill}
                    />
                    <View
                        style={[
                            styles.menuContent,
                            {
                                backgroundColor: isDark
                                    ? 'rgba(40, 40, 45, 0.7)'
                                    : 'rgba(255, 255, 255, 0.7)',
                                borderColor: isDark
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(0,0,0,0.08)',
                            },
                        ]}
                    >
                        {title && (
                            <>
                                <Text
                                    style={[
                                        styles.menuTitle,
                                        { color: isDark ? Colors.glass.text : Colors.light.text },
                                    ]}
                                >
                                    {title}
                                </Text>
                                <VisionOSMenuDivider />
                            </>
                        )}
                        {sections.map((section, index) => (
                            <VisionOSMenuSection
                                key={section.id}
                                section={section}
                                onItemPress={onClose}
                                isLastSection={index === sections.length - 1}
                            />
                        ))}
                    </View>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────
// Inline Menu Component (Non-modal, embedded)
// ─────────────────────────────────────────────────────────────

export function VisionOSInlineMenu({
    sections,
    title,
    style,
}: {
    sections: MenuSection[];
    title?: string;
    style?: ViewStyle;
}) {
    const { isDark } = useTheme();

    return (
        <View style={[styles.inlineMenuContainer, style]}>
            <BlurView
                intensity={isDark ? 60 : 70}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
            />
            <View
                style={[
                    styles.menuContent,
                    {
                        backgroundColor: isDark
                            ? 'rgba(40, 40, 45, 0.6)'
                            : 'rgba(255, 255, 255, 0.6)',
                        borderColor: isDark
                            ? 'rgba(255,255,255,0.1)'
                            : 'rgba(0,0,0,0.08)',
                    },
                ]}
            >
                {title && (
                    <>
                        <Text
                            style={[
                                styles.menuTitle,
                                { color: isDark ? Colors.glass.text : Colors.light.text },
                            ]}
                        >
                            {title}
                        </Text>
                        <VisionOSMenuDivider />
                    </>
                )}
                {sections.map((section, index) => (
                    <VisionOSMenuSection
                        key={section.id}
                        section={section}
                        isLastSection={index === sections.length - 1}
                    />
                ))}
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        minWidth: 260,
        maxWidth: 320,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 8,
    },
    inlineMenuContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    menuContent: {
        borderRadius: 14,
        borderWidth: 0.5,
        overflow: 'hidden',
    },
    menuTitle: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    section: {
        paddingVertical: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    sectionItems: {
        // Container for items within a section
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        minHeight: 44,
    },
    menuItemPressed: {
        // Applied when pressed
    },
    menuItemFirst: {
        // Styling for first item
    },
    menuItemLast: {
        // Styling for last item
    },
    iconContainer: {
        width: 28,
        height: 28,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    menuItemTitle: {
        fontSize: 17,
        fontWeight: '400',
    },
    menuItemSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        gap: 6,
    },
    rightText: {
        fontSize: 15,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 16,
        marginVertical: 4,
    },
});

export default VisionOSMenu;


