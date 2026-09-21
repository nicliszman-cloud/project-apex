import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  listingId?: string | null;
};

type Partner = {
  id: string;
  name: string;
  avatar?: string | null;
};

type ListingContext = {
  id: string;
  title: string;
  image_url: string | null;
  price_cents: number | null;
  currency: string;
  kind: 'sell' | 'trade' | 'wanted';
};

export default function ChatScreen() {
  const { conversationId, listingId } = useLocalSearchParams<{ conversationId?: string; listingId?: string }>();
  const { myUserId, isDemo } = useApp();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [listing, setListing] = useState<ListingContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(isDemo || !conversationId ? [
    { id: '1', senderId: 'other', text: 'Oi! Vi seu projeto no APEX.', createdAt: new Date().toISOString() },
    { id: '2', senderId: 'me', text: 'Valeu! O que achou?', createdAt: new Date().toISOString() },
  ] : []);
  const [loading, setLoading] = useState(Boolean(conversationId && !isDemo));

  useEffect(() => {
    if (isDemo || !conversationId || !supabase || !myUserId) return;

    let active = true;

    async function load() {
      const { data: conversation, error: conversationError } = await supabase!
        .from('conversations')
        .select('id, user_a, user_b')
        .eq('id', conversationId)
        .single();

      if (conversationError || !conversation) {
        if (active) Alert.alert('Conversa', conversationError?.message || 'Conversa não encontrada.');
        setLoading(false);
        return;
      }

      const partnerId = conversation.user_a === myUserId ? conversation.user_b : conversation.user_a;
      const [{ data: profile }, { data: rows, error: messagesError }] = await Promise.all([
        supabase!.from('profiles').select('id, display_name, username, avatar_url').eq('id', partnerId).single(),
        supabase!.from('direct_messages').select('id, sender_id, body, listing_id, created_at').eq('conversation_id', conversationId).order('created_at', { ascending: true }),
      ]);

      if (!active) return;

      if (profile) {
        setPartner({
          id: profile.id,
          name: profile.display_name || profile.username || 'Driver',
          avatar: profile.avatar_url,
        });
      }

      if (messagesError) {
        Alert.alert('Chat', messagesError.message);
      } else {
        setMessages((rows ?? []).map((row: any) => ({
          id: row.id,
          senderId: row.sender_id,
          text: row.body,
          listingId: row.listing_id,
          createdAt: row.created_at,
        })));
      }

      if (listingId) {
        const { data: listingRow } = await supabase!
          .from('marketplace_listings')
          .select('id, title, image_url, price_cents, currency, kind')
          .eq('id', listingId)
          .maybeSingle();
        if (listingRow) setListing(listingRow as ListingContext);
      }

      await supabase!
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', myUserId)
        .is('read_at', null);

      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel('conversation-' + conversationId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: 'conversation_id=eq.' + conversationId,
      }, (payload: any) => {
        const row = payload.new;
        setMessages((current) => current.some((item) => item.id === row.id) ? current : [...current, {
          id: row.id,
          senderId: row.sender_id,
          text: row.body,
          listingId: row.listing_id,
          createdAt: row.created_at,
        }]);

        if (row.sender_id !== myUserId) {
          void supabase!
            .from('direct_messages')
            .update({ read_at: new Date().toISOString() })
            .eq('id', row.id);
        }
      })
      .subscribe();

    return () => {
      active = false;
      void supabase!.removeChannel(channel);
    };
  }, [isDemo, conversationId, myUserId, listingId]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText('');

    if (isDemo || !conversationId || !supabase || !myUserId) {
      setMessages((current) => [...current, { id: String(Date.now()), senderId: 'me', text: body, createdAt: new Date().toISOString() }]);
      return;
    }

    const { data, error } = await supabase
      .from('direct_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: myUserId,
        body,
        listing_id: listingId || null,
      })
      .select('id, sender_id, body, listing_id, created_at')
      .single();

    if (error) {
      setText(body);
      return Alert.alert('Não foi possível enviar', error.message);
    }

    setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, {
      id: data.id,
      senderId: data.sender_id,
      text: data.body,
      listingId: data.listing_id,
      createdAt: data.created_at,
    }]);
  }

  const partnerName = partner?.name || 'Conversa';
  const partnerInitial = useMemo(() => partnerName.slice(0, 1).toUpperCase(), [partnerName]);

  function listingPrice() {
    if (!listing) return '';
    if (listing.kind === 'trade') return 'Troca';
    if (listing.kind === 'wanted') return 'Procuro';
    if (listing.price_cents == null) return 'Consultar';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: listing.currency || 'BRL' }).format(listing.price_cents / 100);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <AppImage uri={partner?.avatar} style={styles.avatarImage} placeholder={<Text style={styles.avatarText}>{partnerInitial}</Text>} />
          <Pressable style={{ flex: 1 }} onPress={() => partner?.id && router.push('/user/' + partner.id)}>
            <Text style={styles.name}>{partnerName}</Text>
            <Text style={styles.status}>Mensagem direta</Text>
          </Pressable>
        </View>

        {!!listing && (
          <Pressable style={styles.listingCard} onPress={() => router.push('/marketplace')}>
            <AppImage uri={listing.image_url} style={styles.listingImage} placeholder={<Text style={styles.listingIcon}>🔧</Text>} />
            <View style={{ flex: 1 }}>
              <Text style={styles.listingLabel}>SOBRE O ANÚNCIO</Text>
              <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.listingPrice}>{listingPrice()}</Text>
            </View>
          </Pressable>
        )}

        {loading ? <View style={styles.loading}><Text style={styles.loadingText}>Carregando conversa...</Text></View> : (
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const mine = isDemo ? item.senderId === 'me' : item.senderId === myUserId;
              return (
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Text style={styles.message}>{item.text}</Text>
                  <Text style={styles.messageTime}>{new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              );
            }}
          />
        )}

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Mensagem..."
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            multiline
            maxLength={4000}
          />
          <Pressable style={styles.send} onPress={() => { void send(); }}><Text style={styles.sendText}>➤</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: 'white', fontSize: 38, marginRight: 10, marginTop: -4 },
  avatarImage: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.surface2 },
  avatarText: { color: 'white', fontWeight: '900' },
  name: { color: 'white', fontWeight: '900', marginLeft: 10 },
  status: { color: theme.colors.muted, fontSize: 10, marginLeft: 10, marginTop: 2 },
  listingCard: { flexDirection: 'row', alignItems: 'center', gap: 11, margin: 10, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  listingImage: { width: 58, height: 58, borderRadius: 12 },
  listingIcon: { fontSize: 24 },
  listingLabel: { color: theme.colors.accent, fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  listingTitle: { color: 'white', fontWeight: '900', marginTop: 3 },
  listingPrice: { color: theme.colors.muted, marginTop: 3, fontSize: 11 },
  list: { padding: 14, gap: 8, paddingBottom: 18 },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: 'flex-end', backgroundColor: theme.colors.accent, borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface2, borderBottomLeftRadius: 5 },
  message: { color: 'white', lineHeight: 19 },
  messageTime: { color: 'rgba(255,255,255,.6)', fontSize: 9, marginTop: 4, textAlign: 'right' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  input: { flex: 1, maxHeight: 120, minHeight: 46, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 23, color: 'white', paddingHorizontal: 16, paddingVertical: 12 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: 'white', fontSize: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.muted },
});
