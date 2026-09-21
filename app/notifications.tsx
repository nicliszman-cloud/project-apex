import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type NotificationRow = {
  id: string;
  type: 'follow' | 'comment' | 'match' | 'event';
  entity_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
};

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
  }

  async function markAll() {
    if (!supabase) return;
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null);
    await load();
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>Notificações</Text>
        <Pressable onPress={markAll} style={styles.mark}><Text style={styles.markText}>Ler todas</Text></Pressable>
      </View>

      {loading ? <View style={styles.center}><Text style={styles.muted}>Carregando...</Text></View> :
        items.length === 0 ? <View style={styles.center}><Text style={styles.icon}>🔔</Text><Text style={styles.emptyTitle}>Nada por aqui ainda</Text><Text style={styles.muted}>Matches, seguidores e comentários aparecerão aqui.</Text></View> :
        <FlatList data={items} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => (
          <Pressable style={[styles.item, !item.read_at && styles.unread]} onPress={() => { void open(item); }}>
            <View style={styles.dot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.body}>{item.body}</Text>
              <Text style={styles.time}>{new Date(item.created_at).toLocaleString('pt-BR')}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )} />
      }
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: 'white', fontSize: 38, marginRight: 8, marginTop: -4 },
  title: { color: 'white', fontSize: 24, fontWeight: '900' },
  mark: { marginLeft: 'auto', padding: 8 },
  markText: { color: theme.colors.accent, fontWeight: '900', fontSize: 12 },
  list: { padding: 14, gap: 9 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 14 },
  unread: { borderColor: '#5D2D1F', backgroundColor: '#17110F' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent, marginRight: 12 },
  body: { color: 'white', fontWeight: '800', lineHeight: 19 },
  time: { color: theme.colors.muted, fontSize: 10, marginTop: 4 },
  chev: { color: theme.colors.muted, fontSize: 26, marginLeft: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  icon: { fontSize: 44 },
  emptyTitle: { color: 'white', fontWeight: '900', fontSize: 20, marginTop: 10, marginBottom: 7 },
  muted: { color: theme.colors.muted, textAlign: 'center' },
});
