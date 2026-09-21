import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { SearchBar } from '@/components/SearchBar';
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

export default function MessagesTabScreen() {
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

  const filtered = items.filter((item) =>
    [item.partnerName, item.lastMessage].join(' ').toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Mensagens</Text>
        <Pressable onPress={() => router.push('/matches')} style={styles.matchButton}>
          <Ionicons name="flame-outline" size={18} color={theme.colors.accent} />
        </Pressable>
      </View>
      <View style={styles.search}><SearchBar value={query} onChangeText={setQuery} placeholder="Buscar conversas..." /></View>

      {loading ? (
        <View style={styles.center}><Text style={styles.muted}>Carregando conversas...</Text></View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="chatbubbles-outline" size={40} color={theme.colors.muted2} />
          <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
          <Text style={styles.muted}>Abra um perfil ou anúncio e envie a primeira mensagem.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => router.push({ pathname: '/chat', params: { conversationId: item.id } })}>
              <AppImage uri={item.partnerAvatar} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{item.partnerName[0]}</Text>} />
              <View style={styles.info}>
                <View style={styles.row}>
                  <Text style={styles.name}>{item.partnerName}</Text>
                  <Text style={styles.time}>{new Date(item.updatedAt).toLocaleDateString('pt-BR')}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={[styles.preview, item.unread > 0 && styles.previewUnread]} numberOfLines={1}>{item.lastMessage}</Text>
                  {item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>}
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
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { color: theme.colors.text, fontSize: 27, fontWeight: '900' },
  matchButton: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  search: { paddingHorizontal: 14, paddingBottom: 12 },
  list: { paddingHorizontal: 12, paddingBottom: 86 },
  item: { flexDirection: 'row', alignItems: 'center', minHeight: 72, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingHorizontal: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarText: { color: theme.colors.text, fontWeight: '900' },
  info: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: theme.colors.text, fontWeight: '900', fontSize: 14, flex: 1 },
  time: { color: theme.colors.muted, fontSize: 9 },
  preview: { color: theme.colors.muted, marginTop: 5, flex: 1, fontSize: 12 },
  previewUnread: { color: theme.colors.textSoft, fontWeight: '800' },
  badge: { minWidth: 19, height: 19, borderRadius: 10, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginTop: 5 },
  badgeText: { color: theme.colors.white, fontSize: 9, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, paddingBottom: 90 },
  emptyTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 18, marginTop: 12, marginBottom: 6 },
  muted: { color: theme.colors.muted, textAlign: 'center', lineHeight: 18 },
});
