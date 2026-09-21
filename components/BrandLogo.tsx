import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { theme } from '@/lib/theme';

export function BrandLogo({ style, size = 25 }: { style?: StyleProp<TextStyle>; size?: number }) {
  return (
    <Text accessibilityRole="header" style={[styles.logo, { fontSize: size }, style]}>
      <Text style={styles.street}>Street</Text><Text style={styles.club}>Club</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: -1.1,
  },
  street: { color: theme.colors.white },
  club: { color: theme.colors.accent },
});
