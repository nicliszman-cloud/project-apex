import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { normalizeStoredMediaUrl } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type ChatMessage = { id: string; senderId: string; text: string; createdAt: string; listingId?: string | null; };
type Partner = { id: string; name: string; username?: string | null; avatar?: string | null; };
type ListingContext = { id: string; title: string; image_url: string | null; price_cents: number | null; currency: string; kind: 'sell' | 'trade' | 'wanted'; };

export default function ChatScreen() {
  const { conversationId, listingId } = useLocalSearchParams<{ conversationId?: string; listingId?: string }>();
  const { myUserId, isDemo } = useApp();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [text, setText] = useState('');
  const [partner, setPartner] = useState<Partner | null>(null);
  const [listing, setListing] = useState<ListingContext | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(conversationId && !isDemo));

  useEffect(() => {
    if (isDemo || !conversationId || !supabase || !myUserId) {
      setLoading(false);
      return;
    }

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

      if (profile) setPartner({ id: profile.id, name: profile.display_name || profile.username || 'Driver', username: profile.username, avatar: normalizeStoredMediaUrl(profile.avatar_url) });

      if (messagesError) {
        Alert.alert('Chat', messagesError.message);
      } else {
        setMessages((rows ?? []).map((row: any) => ({ id: row.id, senderId: row.sender_id, text: row.body, listingId: row.listing_id, createdAt: row.created_at })));
      }

      if (listingId) {
        const { data: listingRow } = await supabase!
          .from('marketplace_listings')
          .select('id, title, image_url, price_cents, currency, kind')
          .eq('id', listingId)
          .maybeSingle();
        if (listingRow) setListing({ ...listingRow, image_url: normalizeStoredMediaUrl(listingRow.image_url) } as ListingContext);
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

    const timer = setInterval(() => {
      if (active) void load();
    }, 3000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [isDemo, conversationId, myUserId, listingId]);

  useEffect(() => {
    if (!messages.length) return;
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 70);
    return () => clearTimeout(timer);
  }, [messages.length]);

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
      .insert({ conversation_id: conversationId, sender_id: myUserId, body, listing_id: listingId || null })
      .select('id, sender_id, body, listing_id, created_at')
      .single();

    if (error) {
      setText(body);
      return Alert.alert('Não foi possível enviar', error.message);
    }

    setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, { id: data.id, senderId: data.sender_id, text: data.body, listingId: data.listing_id, createdAt: data.created_at }]);
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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={theme.colors.text} /></Pressable>
          <AppImage uri={partner?.avatar} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{partnerInitial}</Text>} />
          <Pressable style={styles.partner} onPress={() => partner?.id && router.push('/user/' + partner.id)}>
            <Text style={styles.name} numberOfLines={1}>{partnerName}</Text>
            <Text style={styles.handle}>{partner?.username ? '@' + partner.username : 'StreetClub'}</Text>
          </Pressable>
          <Pressable style={styles.headerIcon}><Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.muted} /></Pressable>
        </View>

        {!!listing && (
          <Pressable style={styles.listingCard} onPress={() => router.push('/marketplace')}>
            <AppImage uri={listing.image_url} style={styles.listingImage} placeholder={<Ionicons name="construct-outline" size={24} color={theme.colors.muted2} />} />
            <View style={styles.listingCopy}>
              <Text style={styles.listingLabel}>ANÚNCIO</Text>
              <Text style={styles.listingTitle} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.listingPrice}>{listingPrice()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.muted2} />
          </Pressable>
        )}

        {loading ? (
          <View style={styles.loading}><Text style={styles.loadingText}>Carregando conversa...</Text></View>
        ) : messages.length === 0 ? (
          <View style={styles.loading}>
            <View style={styles.emptyIcon}><Ionicons name="chatbubble-ellipses-outline" size={30} color={theme.colors.accent} /></View>
            <Text style={styles.emptyTitle}>Comece a conversa</Text>
            <Text style={styles.loadingText}>Fale sobre o projeto, a peça ou o próximo encontro.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 9) }]}>
          <Pressable style={styles.attach}><Ionicons name="add" size={22} color={theme.colors.muted} /></Pressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Mensagem..."
            placeholderTextColor={theme.colors.muted}
            style={styles.input}
            multiline
            maxLength={4000}
          />
          <Pressable accessibilityLabel="Enviar" style={[styles.send, !text.trim() && styles.sendDisabled]} onPress={() => { void send(); }} disabled={!text.trim()}>
            <Ionicons name="arrow-up" size={20} color={theme.colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: theme.colors.borderStrong },
  avatarText: { color: theme.colors.text, fontWeight: '900' },
  partner: { flex: 1, marginLeft: 9 },
  name: { color: theme.colors.text, fontWeight: '900', fontSize: 13.5 },
  handle: { color: theme.colors.muted, fontSize: 9.5, marginTop: 2 },
  headerIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  listingCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginTop: 8, padding: 8, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  listingImage: { width: 52, height: 52, borderRadius: 10 },
  listingCopy: { flex: 1, marginLeft: 10 },
  listingLabel: { color: theme.colors.accent, fontWeight: '900', fontSize: 8, letterSpacing: 1 },
  listingTitle: { color: theme.colors.text, fontWeight: '900', marginTop: 3, fontSize: 11.5 },
  listingPrice: { color: theme.colors.muted, marginTop: 3, fontSize: 9.5 },
  list: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 18, gap: 7 },
  bubble: { maxWidth: '79%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 },
  mine: { alignSelf: 'flex-end', backgroundColor: theme.colors.accent, borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface2, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 5 },
  message: { color: theme.colors.white, lineHeight: 18, fontSize: 12.5 },
  messageTime: { color: 'rgba(255,255,255,.58)', fontSize: 8.5, marginTop: 4, textAlign: 'right' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: '#08090B' },
  attach: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, maxHeight: 112, minHeight: 42, backgroundColor: theme.colors.surface2, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 21, color: theme.colors.text, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12.5 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: 0.4 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  loadingText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 7 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: '#4E1116', backgroundColor: '#170709', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '900', marginTop: 13 },
});
