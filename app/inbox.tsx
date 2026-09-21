import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type ConversationItem = {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  updatedAt: string;
  unread: number;
};

function relativeTime(value: string) {
  const date = new Date(value);
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return 'agora';
  if (minutes < 60) return minutes + ' min';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + ' h';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function InboxScreen() {
  const { myUserId, isDemo } = useApp();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (isDemo) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (!supabase || !myUserId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('id, user_a, user_b, updated_at')
      .order('updated_at', { ascending: false });

    if (error || !conversations?.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    const partnerIds = conversations.map((c: any) => c.user_a === myUserId ? c.user_b : c.user_a);
    const conversationIds = conversations.map((c: any) => c.id);

    const [{ data: profiles }, { data: messages }] = await Promise.all([
      supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', partnerIds),
      supabase.from('direct_messages').select('id, conversation_id, sender_id, body, read_at, created_at').in('conversation_id', conversationIds).order('created_at', { ascending: false }),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const latest = new Map<string, any>();
    const unread = new Map<string, number>();

    for (const message of messages ?? []) {
      if (!latest.has(message.conversation_id)) latest.set(message.conversation_id, message);
      if (message.sender_id !== myUserId && !message.read_at) {
        unread.set(message.conversation_id, (unread.get(message.conversation_id) ?? 0) + 1);
      }
    }

    setItems(conversations.map((c: any) => {
      const partnerId = c.user_a === myUserId ? c.user_b : c.user_a;
      const p: any = profileMap.get(partnerId);
      const last = latest.get(c.id);
      return {
        id: c.id,
        partnerId,
        partnerName: p?.display_name || p?.username || 'Driver',
        partnerAvatar: p?.avatar_url || null,
        lastMessage: last?.body || 'Conversa iniciada',
        updatedAt: last?.created_at || c.updated_at,
        unread: unread.get(c.id) || 0,
      };
    }));
    setLoading(false);
  }, [myUserId, isDemo]);

  useEffect(() => { void load(); }, [load]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => (item.partnerName + ' ' + item.lastMessage).toLowerCase().includes(q));
  }, [items, query]);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mensagens</Text>
          <Text style={styles.subtitle}>Conexões da comunidade</Text>
        </View>
        <Pressable accessibilityLabel="Garage Matches" onPress={() => router.push('/matches')} style={styles.matchButton}>
          <Ionicons name="flame-outline" size={19} color={theme.colors.accent} />
        </Pressable>
      </View>

      <View style={styles.search}><SearchBar value={query} onChangeText={setQuery} placeholder="Buscar conversas..." /></View>

      {loading ? (
        <View style={styles.loading}><Text style={styles.muted}>Carregando conversas...</Text></View>
      ) : visible.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title={query ? 'Nenhuma conversa encontrada' : 'Sua caixa de entrada está vazia'}
          body={query ? 'Tente buscar por outro nome.' : 'Abra um perfil, carro ou anúncio e comece uma conversa.'}
          action={!query ? 'Explorar comunidade' : undefined}
          onAction={!query ? () => router.push('/(tabs)/discover') : undefined}
        />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              onPress={() => router.push({ pathname: '/chat', params: { conversationId: item.id } })}
            >
              <AppImage
                uri={item.partnerAvatar}
                style={styles.avatar}
                placeholder={<Text style={styles.avatarText}>{item.partnerName.slice(0, 1).toUpperCase()}</Text>}
              />
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name} numberOfLines={1}>{item.partnerName}</Text>
                  <Text style={styles.time}>{relativeTime(item.updatedAt)}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.preview, item.unread > 0 && styles.previewUnread]} numberOfLines={1}>{item.lastMessage}</Text>
                  {item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread > 99 ? '99+' : item.unread}</Text></View>}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  title: { color: theme.colors.text, fontSize: 29, fontWeight: '900' },
  subtitle: { color: theme.colors.muted, fontSize: 10.5, marginTop: 2 },
  matchButton: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, backgroundColor: '#160709', borderWidth: 1, borderColor: '#4E1116', alignItems: 'center', justifyContent: 'center' },
  search: { paddingHorizontal: 14, paddingBottom: 10 },
  list: { paddingHorizontal: 12, paddingBottom: 22 },
  item: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  itemPressed: { opacity: 0.65 },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 1, borderColor: theme.colors.borderStrong },
  avatarText: { color: theme.colors.text, fontWeight: '900', fontSize: 18 },
  info: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: theme.colors.text, fontWeight: '900', fontSize: 13.5, flex: 1 },
  time: { color: theme.colors.muted2, fontSize: 9.5, marginLeft: 10 },
  preview: { color: theme.colors.muted, marginTop: 5, flex: 1, fontSize: 11.5 },
  previewUnread: { color: theme.colors.textSoft, fontWeight: '800' },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginTop: 5 },
  badgeText: { color: theme.colors.white, fontSize: 9, fontWeight: '900' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
});
