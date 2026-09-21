import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
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

export default function InboxScreen() {
  const { myUserId, isDemo } = useApp();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (isDemo) {
      setItems([{ id: 'demo', partnerId: 'other', partnerName: 'Marina', partnerAvatar: null, lastMessage: 'Curti muito seu projeto.', updatedAt: new Date().toISOString(), unread: 1 }]);
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

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <View><Text style={styles.title}>Mensagens</Text><Text style={styles.sub}>Converse sem precisar de match.</Text></View>
        <Pressable style={styles.matches} onPress={() => router.push('/matches')}><Text style={styles.matchesText}>🔥 Matches</Text></Pressable>
      </View>

      {loading ? <View style={styles.center}><Text style={styles.muted}>Carregando conversas...</Text></View> :
        items.length === 0 ? <View style={styles.center}><Text style={styles.icon}>💬</Text><Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text><Text style={styles.muted}>Abra o perfil de alguém ou um anúncio do Marketplace e toque em Mensagem.</Text></View> :
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.item} onPress={() => router.push({ pathname: '/chat', params: { conversationId: item.id } })}>
              <AppImage uri={item.partnerAvatar} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{item.partnerName[0]}</Text>} />
              <View style={styles.info}>
                <View style={styles.row}><Text style={styles.name}>{item.partnerName}</Text><Text style={styles.time}>{new Date(item.updatedAt).toLocaleDateString('pt-BR')}</Text></View>
                <View style={styles.row}><Text style={[styles.preview, item.unread > 0 && styles.previewUnread]} numberOfLines={1}>{item.lastMessage}</Text>{item.unread > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{item.unread}</Text></View>}</View>
              </View>
            </Pressable>
          )}
        />
      }
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: 'white', fontSize: 38, marginRight: 8, marginTop: -4 },
  title: { color: 'white', fontSize: 24, fontWeight: '900' },
  sub: { color: theme.colors.muted, fontSize: 10, marginTop: 2 },
  matches: { marginLeft: 'auto', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 8 },
  matchesText: { color: 'white', fontWeight: '800', fontSize: 10 },
  list: { padding: 12, gap: 8 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 11 },
  avatar: { width: 54, height: 54, borderRadius: 18 },
  avatarText: { color: 'white', fontWeight: '900', fontSize: 20 },
  info: { flex: 1, marginLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: 'white', fontWeight: '900', fontSize: 16, flex: 1 },
  time: { color: theme.colors.muted, fontSize: 9 },
  preview: { color: theme.colors.muted, marginTop: 5, flex: 1 },
  previewUnread: { color: 'white', fontWeight: '800' },
  badge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginTop: 5 },
  badgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  icon: { fontSize: 44 },
  emptyTitle: { color: 'white', fontWeight: '900', fontSize: 20, marginTop: 10, marginBottom: 7 },
  muted: { color: theme.colors.muted, textAlign: 'center', lineHeight: 19 },
});
