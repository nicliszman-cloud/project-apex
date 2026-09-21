import { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '@/lib/theme';

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
});
