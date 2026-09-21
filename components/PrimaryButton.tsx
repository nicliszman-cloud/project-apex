import { PropsWithChildren } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  style,
}: PropsWithChildren<{ onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle> }>) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, style, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Text style={styles.text}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  text: { color: theme.colors.white, fontSize: 14, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  pressed: { backgroundColor: theme.colors.accentPressed },
});
