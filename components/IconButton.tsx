import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function IconButton({
  name,
  onPress,
  active = false,
  size = 21,
  style,
  accessibilityLabel,
}: {
  name: IconName;
  onPress?: () => void;
  active?: boolean;
  size?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.button, active && styles.active, pressed && styles.pressed, style]}
    >
      <Ionicons name={name} size={size} color={active ? theme.colors.accent : theme.colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: { backgroundColor: theme.colors.accentSoft },
  pressed: { opacity: 0.64 },
});
