import { ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'success' | 'danger' | 'neutral';
  disabled?: boolean;
  icon?: ReactNode;
};

export const TVButton = ({ label, onPress, tone = 'primary', disabled, icon }: Props) => {
  const [focused, setFocused] = useState(false);

  const tintMap = {
    primary: colors.accent,
    success: colors.success,
    danger: colors.danger,
    neutral: colors.textSecondary,
  } as const;

  const tint = tintMap[tone];

  return (
    <Pressable
      focusable
      onPress={onPress}
      disabled={disabled}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.base,
        { borderColor: tint },
        focused && { backgroundColor: colors.cardActive, borderColor: tint },
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={styles.row}>
        {icon}
        <Text style={[styles.label, { color: tint }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
