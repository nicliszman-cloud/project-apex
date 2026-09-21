import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { openConversation } from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Listing = {
  id: string;
  seller_id: string;
  kind: 'sell' | 'trade' | 'wanted';
  title: string;
  description: string | null;
  price_cents: number | null;
  currency: string;
  part_category: string | null;
  compatibility: string | null;
  city: string | null;
  state: string | null;
  image_url: string | null;
  status: string;
  created_at: string;
  sellerName?: string;
};

export default function MarketplaceScreen() {
  const { myUserId } = useApp();
  const [listings, setListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'sell' | 'trade' | 'wanted'>('all');

  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('marketplace_listings')
      .select('*')
      .in('status', ['active', 'reserved'])
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Marketplace', error.message);
      return;
    }

    const sellerIds = [...new Set((data ?? []).map((row: any) => row.seller_id))];
    const { data: profiles } = sellerIds.length
      ? await supabase.from('profiles').select('id, display_name, username').in('id', sellerIds)
      : { data: [] as any[] };

    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    setListings((data ?? []).map((row: any) => ({
      ...row,
      sellerName: map.get(row.seller_id)?.display_name || map.get(row.seller_id)?.username || 'Driver',
    })));
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => listings.filter((item) => {
    const matchKind = kind === 'all' || item.kind === kind;
    const haystack = [item.title, item.description, item.part_category, item.compatibility, item.city, item.state].filter(Boolean).join(' ').toLowerCase();
    return matchKind && haystack.includes(query.trim().toLowerCase());
  }), [listings, query, kind]);

  function price(item: Listing) {
    if (item.kind === 'trade') return 'Troca';
    if (item.kind === 'wanted') return 'Procuro';
    if (item.price_cents == null) return 'Consultar';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: item.currency || 'BRL' }).format(item.price_cents / 100);
  }

  async function messageSeller(item: Listing) {
    if (item.seller_id === myUserId) return;
    try {
      const conversationId = await openConversation(item.seller_id);
      router.push({
        pathname: '/chat',
        params: { conversationId, listingId: item.id },
      });
    } catch (error: any) {
      Alert.alert('Mensagem', error?.message ?? 'Não foi possível abrir a conversa.');
    }
  }

  async function setStatus(item: Listing, status: 'active' | 'reserved' | 'sold') {
    if (!supabase || item.seller_id !== myUserId) return;
    const { error } = await supabase.from('marketplace_listings').update({ status }).eq('id', item.id);
    if (error) return Alert.alert('Anúncio', error.message);
    await load();
  }

  function remove(item: Listing) {
    if (!supabase || item.seller_id !== myUserId) return;
    Alert.alert('Excluir anúncio', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error } = await supabase!.from('marketplace_listings').delete().eq('id', item.id);
        if (error) Alert.alert('Erro', error.message);
        else await load();
      }},
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <View><Text style={styles.title}>Peças</Text><Text style={styles.sub}>Vender, trocar, procurar e conversar.</Text></View>
          <Pressable style={styles.create} onPress={() => router.push('/marketplace-create')}><Text style={styles.createText}>＋</Text></Pressable>
        </View>

        <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Buscar peça, modelo, compatibilidade..." placeholderTextColor={theme.colors.muted} />

        <View style={styles.chips}>
          {[
            ['all', 'Todos'], ['sell', 'À venda'], ['trade', 'Trocas'], ['wanted', 'Procuro'],
          ].map(([value, label]) => <Pressable key={value} style={[styles.chip, kind === value && styles.chipOn]} onPress={() => setKind(value as any)}><Text style={[styles.chipText, kind === value && styles.chipTextOn]}>{label}</Text></Pressable>)}
        </View>

        {filtered.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>🔧</Text><Text style={styles.emptyTitle}>Nenhum anúncio encontrado</Text><Text style={styles.muted}>Crie o primeiro anúncio ou mude os filtros.</Text></View> :
          filtered.map((item) => {
            const mine = item.seller_id === myUserId;
            return (
              <View key={item.id} style={styles.card}>
                <AppImage uri={item.image_url} style={styles.image} placeholder={<Text style={styles.bigIcon}>🔧</Text>} />
                <View style={styles.body}>
                  <View style={styles.row}>
                    <Text style={styles.kind}>{item.kind === 'sell' ? 'VENDA' : item.kind === 'trade' ? 'TROCA' : 'PROCURA'}</Text>
                    {item.status === 'reserved' && <Text style={styles.reserved}>RESERVADO</Text>}
                    <Text style={styles.price}>{price(item)}</Text>
                  </View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {!!item.compatibility && <Text style={styles.compat}>Compatível: {item.compatibility}</Text>}
                  {!!item.description && <Text style={styles.desc}>{item.description}</Text>}

                  <View style={styles.footer}>
                    <Text style={styles.location}>📍 {[item.city, item.state].filter(Boolean).join(' • ') || 'Local não informado'}</Text>
                    <Pressable onPress={() => router.push('/user/' + item.seller_id)}><Text style={styles.seller}>{item.sellerName}</Text></Pressable>
                  </View>

                  {mine ? (
                    <View style={styles.ownerActions}>
                      <Pressable style={styles.secondary} onPress={() => { void setStatus(item, item.status === 'reserved' ? 'active' : 'reserved'); }}>
                        <Text style={styles.secondaryText}>{item.status === 'reserved' ? 'Reativar' : 'Reservar'}</Text>
                      </Pressable>
                      <Pressable style={styles.secondary} onPress={() => { void setStatus(item, 'sold'); }}><Text style={styles.secondaryText}>Vendido</Text></Pressable>
                      <Pressable style={styles.delete} onPress={() => remove(item)}><Text style={styles.deleteText}>Excluir</Text></Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.messageButton} onPress={() => { void messageSeller(item); }}>
                      <Text style={styles.messageText}>💬 Mensagem para o vendedor</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        }
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { color: 'white', fontSize: 38, marginRight: 10, marginTop: -4 },
  title: { color: 'white', fontSize: 28, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 2 },
  create: { marginLeft: 'auto', width: 44, height: 44, borderRadius: 16, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  createText: { color: 'white', fontSize: 28, marginTop: -2 },
  search: { marginTop: 18, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, color: 'white', padding: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 15 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: 'white' },
  card: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, overflow: 'hidden', marginBottom: 14 },
  image: { width: '100%', height: 210 },
  bigIcon: { fontSize: 44 },
  body: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kind: { color: theme.colors.accent, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  reserved: { color: '#F5C451', fontWeight: '900', fontSize: 9 },
  price: { marginLeft: 'auto', color: 'white', fontWeight: '900' },
  itemTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 5 },
  compat: { color: '#D6D8DC', marginTop: 6, fontSize: 12 },
  desc: { color: theme.colors.muted, lineHeight: 19, marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  location: { color: theme.colors.muted, fontSize: 11, flex: 1 },
  seller: { color: theme.colors.accent, fontWeight: '900', fontSize: 11 },
  messageButton: { backgroundColor: theme.colors.accent, borderRadius: 13, padding: 13, alignItems: 'center', marginTop: 14 },
  messageText: { color: 'white', fontWeight: '900' },
  ownerActions: { flexDirection: 'row', gap: 7, marginTop: 14 },
  secondary: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 10, alignItems: 'center' },
  secondaryText: { color: 'white', fontWeight: '800', fontSize: 11 },
  delete: { borderWidth: 1, borderColor: '#68343A', borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center' },
  deleteText: { color: '#F07880', fontWeight: '900', fontSize: 11 },
  empty: { padding: 30, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 9 },
  muted: { color: theme.colors.muted, marginTop: 6, textAlign: 'center' },
});
