import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState } from '@/components/EmptyState';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type NotificationRow = {
  id: string;
  type: 'follow' | 'comment' | 'match' | 'event' | 'message' | 'marketplace';
  entity_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

function iconFor(type: NotificationRow['type']): React.ComponentProps<typeof Ionicons>['name'] {
  if (type === 'follow') return 'person-add-outline';
  if (type === 'comment') return 'chatbubble-outline';
  if (type === 'match') return 'flame-outline';
  if (type === 'event') return 'calendar-outline';
  if (type === 'marketplace') return 'construct-outline';
  return 'mail-outline';
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, entity_id, body, read_at, created_at')
      .order('created_at', { ascending: false });
    if (!error) setItems((data ?? []) as NotificationRow[]);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function open(item: NotificationRow) {
    if (supabase && !item.read_at) {
      await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', item.id);
      setItems((current) => current.map((n) => n.id === item.id ? { ...n, read_at: new Date().toISOString() } : n));
    }
    if (item.type === 'comment' && item.entity_id) router.push('/post/' + item.entity_id);
    else if (item.type === 'match') router.push('/matches');
    else if (item.type === 'follow' && item.entity_id) router.push('/user/' + item.entity_id);
    else if ((item.type === 'message' || item.type === 'marketplace') && item.entity_id) router.push({ pathname: '/chat', params: { conversationId: item.entity_id } });
  }

  async function markAll() {
    if (!supabase) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
    await load();
  }

  return (
    <Screen>
      <ScreenHeader
        title="Notificações"
        subtitle="Atividade da sua conta"
        right={<Pressable onPress={() => { void markAll(); }} style={styles.mark}><Text style={styles.markText}>Ler todas</Text></Pressable>}
      />

      {loading ? (
        <View style={styles.center}><Text style={styles.muted}>Carregando...</Text></View>
      ) : items.length === 0 ? (
        <EmptyState icon="notifications-outline" title="Tudo tranquilo por aqui" body="Mensagens, seguidores, comentários e matches aparecerão nesta tela." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={[styles.item, !item.read_at && styles.unread]} onPress={() => { void open(item); }}>
              <View style={[styles.iconWrap, !item.read_at && styles.iconUnread]}>
                <Ionicons name={iconFor(item.type)} size={19} color={!item.read_at ? theme.colors.accent : theme.colors.muted} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.body, !item.read_at && styles.bodyUnread]}>{item.body}</Text>
                <Text style={styles.time}>{new Date(item.created_at).toLocaleString('pt-BR')}</Text>
              </View>
              {!item.read_at && <View style={styles.dot} />}
              <Ionicons name="chevron-forward" size={17} color={theme.colors.muted2} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mark: { paddingVertical: 8, paddingLeft: 10 },
  markText: { color: theme.colors.accent, fontWeight: '900', fontSize: 10.5 },
  list: { paddingHorizontal: 12, paddingBottom: 24 },
  item: { minHeight: 76, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  unread: { backgroundColor: '#0E090A' },
  iconWrap: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  iconUnread: { borderColor: '#4E1116', backgroundColor: '#170709' },
  copy: { flex: 1, marginLeft: 11 },
  body: { color: theme.colors.textSoft, fontSize: 11.5, lineHeight: 17 },
  bodyUnread: { color: theme.colors.text, fontWeight: '800' },
  time: { color: theme.colors.muted2, fontSize: 8.5, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.accent, marginRight: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
});
