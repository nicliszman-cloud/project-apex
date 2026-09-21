import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '@/lib/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
}: {
  icon: IconName;
  title: string;
  body?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}><Ionicons name={icon} size={30} color={theme.colors.accent} /></View>
      <Text style={styles.title}>{title}</Text>
      {!!body && <Text style={styles.body}>{body}</Text>}
      {!!action && !!onAction && (
        <Pressable onPress={onAction} style={styles.action}><Text style={styles.actionText}>{action}</Text></Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { margin: 18, padding: 28, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center' },
  iconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#170709', borderWidth: 1, borderColor: '#4E1116', alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 14 },
  body: { color: theme.colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, maxWidth: 290 },
  action: { marginTop: 16, minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  actionText: { color: theme.colors.white, fontSize: 11, fontWeight: '900' },
});
