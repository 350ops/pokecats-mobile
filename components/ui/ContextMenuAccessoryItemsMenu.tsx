import { Colors } from '@/constants/Colors';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { IconSymbol } from './icon-symbol';

export type ContextMenuAccessoryItem = {
  /** Unique key for React rendering */
  key: string;
  /** SF Symbol name (iOS). On Android/web this must exist in `components/ui/icon-symbol.tsx` mapping. */
  icon: Parameters<typeof IconSymbol>[0]['name'];
  onPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export type ContextMenuAccessoryItemsMenuVariant = 'default' | 'compact';

export type ContextMenuAccessoryItemsMenuProps = {
  items: ContextMenuAccessoryItem[];
  variant?: ContextMenuAccessoryItemsMenuVariant;
  style?: StyleProp<ViewStyle>;

  /** Blur strength; Figma uses a heavy blur so this defaults higher than `GlassView`. */
  intensity?: number;

  /** Allows overriding the default fixed width (Figma: 220). */
  width?: number;
};

const VARIANTS = {
  default: { width: 220, height: 48, padding: 12, gap: 16, iconSize: 24 },
  compact: { width: 188, height: 44, padding: 10, gap: 12, iconSize: 22 },
} as const;

/**
 * Figma node: "Context Menu - Accessory Items Menu" (2005:26092)
 * - Glass pill container with 5 icon-only actions.
 */
export function ContextMenuAccessoryItemsMenu({
  items,
  variant = 'default',
  style,
  intensity = 70,
  width,
}: ContextMenuAccessoryItemsMenuProps) {
  const { isDark } = useTheme();
  const v = VARIANTS[variant];

  // Figma: bg rgba(128,128,128,0.3)
  // Use a slightly darker glass in dark mode to preserve contrast with white icons.
  const backgroundColor = isDark ? 'rgba(128, 128, 128, 0.24)' : 'rgba(128, 128, 128, 0.3)';
  // Figma: border rgba(255,255,255,0.4) at 1.4px
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.12)';
  const iconColor = Colors.white;

  return (
    <View
      style={[
        styles.container,
        {
          width: width ?? v.width,
          height: v.height,
          padding: v.padding,
          borderRadius: 999,
          backgroundColor,
          borderColor,
        },
        style,
      ]}
    >
      <BlurView intensity={intensity} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

      <View style={[styles.row, { gap: v.gap }]}>
        {items.map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.accessibilityLabel}
            disabled={item.disabled}
            testID={item.testID}
            onPress={item.onPress}
            hitSlop={10}
            style={({ pressed }) => [
              styles.item,
              (pressed || item.selected) && styles.itemPressed,
              item.disabled && styles.itemDisabled,
            ]}
          >
            <IconSymbol
              // IconSymbol typing differs on iOS vs Android/web; this is intentionally permissive.
              // @ts-ignore
              name={item.icon}
              size={v.iconSize}
              color={iconColor}
              style={{ opacity: item.disabled ? 0.4 : 1 }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1.4,
    justifyContent: 'center',
    // Figma drop shadow: 0 2 4 rgba(0,0,0,0.1)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    zIndex: 1, // ensure above blur
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  itemDisabled: {
    opacity: 0.6,
  },
});


