import { ReactNode, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  preferred?: boolean;
  disabled?: boolean;
};

export const TVFocusableCard = ({ children, onPress, onFocus, onBlur, preferred, disabled }: Props) => {
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      hasTVPreferredFocus={preferred}
      focusable
      disabled={disabled}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      style={({ pressed }) => [
        styles.card,
        focused && styles.cardFocused,
        pressed && styles.cardPressed,
        disabled && styles.cardDisabled,
      ]}
    >
      <View pointerEvents="none">{children}</View>
      {focused && <View style={styles.focusRing} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardFocused: {
    backgroundColor: colors.cardActive,
    borderColor: colors.accentSoft,
    transform: Platform.isTV ? [{ scale: 1.02 }] : undefined,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  focusRing: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.accentSoft,
    opacity: 0.7,
  },
});
