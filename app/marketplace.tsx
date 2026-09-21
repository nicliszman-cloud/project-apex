import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
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
  const [listings, setListings] = useState<Listing[]>([]);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | 'sell' | 'trade' | 'wanted'>('all');

  async function load() {
    if (!supabase) return;
    const { data } = await supabase.from('marketplace_listings').select('*').eq('status', 'active').order('created_at', { ascending: false });
    const sellerIds = [...new Set((data ?? []).map((row: any) => row.seller_id))];
    const { data: profiles } = sellerIds.length ? await supabase.from('profiles').select('id, display_name, username').in('id', sellerIds) : { data: [] as any[] };
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

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View><Text style={styles.title}>Peças</Text><Text style={styles.sub}>Vender, trocar e procurar.</Text></View><Pressable style={styles.create} onPress={() => router.push('/marketplace-create')}><Text style={styles.createText}>＋</Text></Pressable></View>

        <TextInput style={styles.search} value={query} onChangeText={setQuery} placeholder="Buscar peça, modelo, compatibilidade..." placeholderTextColor={theme.colors.muted} />

        <View style={styles.chips}>
          {[
            ['all', 'Todos'], ['sell', 'À venda'], ['trade', 'Trocas'], ['wanted', 'Procuro'],
          ].map(([value, label]) => <Pressable key={value} style={[styles.chip, kind === value && styles.chipOn]} onPress={() => setKind(value as any)}><Text style={[styles.chipText, kind === value && styles.chipTextOn]}>{label}</Text></Pressable>)}
        </View>

        {filtered.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>🔧</Text><Text style={styles.emptyTitle}>Nenhum anúncio encontrado</Text><Text style={styles.muted}>Crie o primeiro anúncio ou mude os filtros.</Text></View> :
          filtered.map((item) => <View key={item.id} style={styles.card}>
            {item.image_url ? <Image source={{ uri: item.image_url }} style={styles.image} /> : <View style={styles.imageFallback}><Text style={styles.bigIcon}>🔧</Text></View>}
            <View style={styles.body}>
              <View style={styles.row}><Text style={styles.kind}>{item.kind === 'sell' ? 'VENDA' : item.kind === 'trade' ? 'TROCA' : 'PROCURA'}</Text><Text style={styles.price}>{price(item)}</Text></View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              {!!item.compatibility && <Text style={styles.compat}>Compatível: {item.compatibility}</Text>}
              {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
              <View style={styles.footer}><Text style={styles.location}>📍 {[item.city, item.state].filter(Boolean).join(' • ') || 'Local não informado'}</Text><Pressable onPress={() => router.push('/user/' + item.seller_id)}><Text style={styles.seller}>{item.sellerName}</Text></Pressable></View>
            </View>
          </View>)
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
  image: { width: '100%', height: 190 },
  imageFallback: { width: '100%', height: 150, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface2 },
  bigIcon: { fontSize: 44 },
  body: { padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  kind: { color: theme.colors.accent, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  price: { marginLeft: 'auto', color: 'white', fontWeight: '900' },
  itemTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 5 },
  compat: { color: '#D6D8DC', marginTop: 6, fontSize: 12 },
  desc: { color: theme.colors.muted, lineHeight: 19, marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  location: { color: theme.colors.muted, fontSize: 11, flex: 1 },
  seller: { color: theme.colors.accent, fontWeight: '900', fontSize: 11 },
  empty: { padding: 30, alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 9 },
  muted: { color: theme.colors.muted, marginTop: 6, textAlign: 'center' },
});
