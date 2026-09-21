import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { SearchBar } from '@/components/SearchBar';
import { SectionTabs } from '@/components/SectionTabs';
import { EmptyState } from '@/components/EmptyState';
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

const categories = ['Todas', 'Motor', 'Turbo', 'Suspensão', 'Rodas', 'Freios', 'Exterior', 'Interior'] as const;
type Category = typeof categories[number];

export default function MarketplaceScreen() {
  const { mine } = useLocalSearchParams<{ mine?: string }>();
  const { myUserId } = useApp();
  const [listings, setListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('Todas');
  const [saved, setSaved] = useState<string[]>([]);

  async function load() {
    if (!supabase) return;
    let request = supabase
      .from('marketplace_listings')
      .select('*')
      .in('status', ['active', 'reserved'])
      .order('created_at', { ascending: false });

    if (mine === '1' && myUserId) request = request.eq('seller_id', myUserId);

    const { data, error } = await request;
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

  useEffect(() => { void load(); }, [mine, myUserId]);

  const filtered = useMemo(() => listings.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || [item.title, item.description, item.part_category, item.compatibility, item.city, item.state].filter(Boolean).join(' ').toLowerCase().includes(q);
    const matchesCategory = category === 'Todas' || (item.part_category || '').toLowerCase().includes(category.toLowerCase());
    return matchesQuery && matchesCategory;
  }), [listings, query, category]);

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
      router.push({ pathname: '/chat', params: { conversationId, listingId: item.id } });
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

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={theme.colors.text} /></Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{mine === '1' ? 'Meus anúncios' : 'Peças'}</Text>
            <Text style={styles.sub}>Marketplace StreetClub</Text>
          </View>
          <Pressable style={styles.create} onPress={() => router.push('/marketplace-create')}><Ionicons name="add" size={23} color={theme.colors.white} /></Pressable>
        </View>

        <View style={styles.search}><SearchBar value={query} onChangeText={setQuery} placeholder="Buscar peças, marcas, compatibilidade..." /></View>
        <SectionTabs items={categories} value={category} onChange={setCategory} compact />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>{category === 'Todas' ? 'Anúncios recentes' : category}</Text>
          <Text style={styles.count}>{filtered.length}</Text>
        </View>

        {filtered.length === 0 ? (
          <EmptyState
            icon="construct-outline"
            title="Nenhum anúncio encontrado"
            body={mine === '1' ? 'Seus anúncios aparecerão aqui.' : 'Tente outra busca ou publique uma peça.'}
            action="Anunciar peça"
            onAction={() => router.push('/marketplace-create')}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((item) => {
              const own = item.seller_id === myUserId;
              const isSaved = saved.includes(item.id);
              return (
                <View key={item.id} style={styles.card}>
                  <AppImage uri={item.image_url} style={styles.image} placeholder={<Ionicons name="construct-outline" size={28} color={theme.colors.muted2} />} />
                  <View style={styles.cardBody}>
                    <View style={styles.topRow}>
                      <View style={styles.kindPill}><Text style={styles.kindText}>{item.kind === 'sell' ? 'VENDA' : item.kind === 'trade' ? 'TROCA' : 'PROCURA'}</Text></View>
                      {item.status === 'reserved' && <Text style={styles.reserved}>RESERVADO</Text>}
                      {!own && (
                        <Pressable hitSlop={8} onPress={() => toggleSaved(item.id)} style={styles.favorite}>
                          <Ionicons name={isSaved ? 'heart' : 'heart-outline'} size={20} color={isSaved ? theme.colors.accent : theme.colors.muted} />
                        </Pressable>
                      )}
                    </View>

                    <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.price}>{price(item)}</Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.part_category || 'Peça'} · {[item.city, item.state].filter(Boolean).join(', ') || 'Brasil'}
                    </Text>
                    {!!item.compatibility && <Text style={styles.compat} numberOfLines={1}>{item.compatibility}</Text>}

                    <View style={styles.sellerRow}>
                      <Pressable onPress={() => router.push('/user/' + item.seller_id)} style={styles.sellerLink}>
                        <Ionicons name="person-circle-outline" size={16} color={theme.colors.muted} />
                        <Text style={styles.seller} numberOfLines={1}>{item.sellerName}</Text>
                      </Pressable>
                    </View>

                    {own ? (
                      <View style={styles.ownerActions}>
                        <Pressable style={styles.secondary} onPress={() => { void setStatus(item, item.status === 'reserved' ? 'active' : 'reserved'); }}>
                          <Text style={styles.secondaryText}>{item.status === 'reserved' ? 'Reativar' : 'Reservar'}</Text>
                        </Pressable>
                        <Pressable style={styles.secondary} onPress={() => { void setStatus(item, 'sold'); }}><Text style={styles.secondaryText}>Vendido</Text></Pressable>
                        <Pressable style={styles.delete} onPress={() => remove(item)}><Ionicons name="trash-outline" size={17} color={theme.colors.danger} /></Pressable>
                      </View>
                    ) : (
                      <Pressable style={styles.messageButton} onPress={() => { void messageSeller(item); }}>
                        <Ionicons name="chatbubble-outline" size={17} color={theme.colors.white} />
                        <Text style={styles.messageText}>Mensagem para o vendedor</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  header: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 2 },
  title: { color: theme.colors.text, fontSize: 26, fontWeight: '900' },
  sub: { color: theme.colors.muted, fontSize: 9.5, marginTop: 2 },
  create: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  search: { paddingHorizontal: 14, paddingBottom: 11 },
  sectionHead: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  count: { color: theme.colors.muted, fontSize: 10, marginLeft: 7 },
  list: { paddingHorizontal: 14, gap: 10 },
  card: { minHeight: 128, flexDirection: 'row', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, overflow: 'hidden' },
  image: { width: 118, minHeight: 128 },
  cardBody: { flex: 1, padding: 11 },
  topRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center' },
  kindPill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, backgroundColor: '#20080A', borderWidth: 1, borderColor: '#4E1116' },
  kindText: { color: theme.colors.accent, fontSize: 7.5, fontWeight: '900', letterSpacing: .8 },
  reserved: { color: theme.colors.warning, fontSize: 7.5, fontWeight: '900', marginLeft: 6 },
  favorite: { marginLeft: 'auto' },
  itemTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: '900', marginTop: 6 },
  price: { color: theme.colors.text, fontSize: 12.5, fontWeight: '900', marginTop: 4 },
  meta: { color: theme.colors.muted, fontSize: 9.5, marginTop: 4 },
  compat: { color: theme.colors.textSoft, fontSize: 9.5, marginTop: 3 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  sellerLink: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '100%' },
  seller: { color: theme.colors.muted, fontSize: 9.5, fontWeight: '700', flexShrink: 1 },
  messageButton: { minHeight: 36, marginTop: 9, borderRadius: 18, backgroundColor: theme.colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 10 },
  messageText: { color: theme.colors.white, fontWeight: '900', fontSize: 9.5 },
  ownerActions: { flexDirection: 'row', gap: 6, marginTop: 9 },
  secondary: { flex: 1, height: 34, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: theme.colors.text, fontWeight: '800', fontSize: 9 },
  delete: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: '#572026', alignItems: 'center', justifyContent: 'center' },
});
