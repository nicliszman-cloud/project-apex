import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { CarCard } from '@/components/CarCard';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { CarCategory } from '@/types';

const SWIPE = Dimensions.get('window').width * 0.28;
const categories: Array<'Todos' | CarCategory> = ['Todos', 'JDM', 'Euro', 'Muscle', 'Supercar', 'Hot Hatch', 'Track'];

export default function DiscoverScreen() {
  const { cars, swipeCar, myUserId, isDemo, loading } = useApp();
  const [index, setIndex] = useState(0);
  const [match, setMatch] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [category, setCategory] = useState<'Todos' | CarCategory>('Todos');
  const [makeQuery, setMakeQuery] = useState('');
  const [minHp, setMinHp] = useState('');
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [evaluatedIds, setEvaluatedIds] = useState<string[]>([]);
  const position = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    async function loadRules() {
      if (!supabase || !myUserId || isDemo) return;
      const [blocks, swipes] = await Promise.all([
        supabase.from('blocks').select('blocked_id').eq('blocker_id', myUserId),
        supabase.from('swipes').select('target_car_id').eq('user_id', myUserId),
      ]);
      setBlockedIds((blocks.data ?? []).map((row: any) => row.blocked_id));
      setEvaluatedIds((swipes.data ?? []).map((row: any) => row.target_car_id));
    }
    void loadRules();
  }, [myUserId, isDemo]);

  const discoverCars = useMemo(() => {
    const q = makeQuery.trim().toLowerCase();
    const hp = Number(minHp || 0);
    return cars.filter((item) => {
      if (!isDemo && item.ownerId === myUserId) return false;
      if (!isDemo && blockedIds.includes(item.ownerId)) return false;
      if (!isDemo && evaluatedIds.includes(item.id)) return false;
      if (category !== 'Todos' && item.category !== category) return false;
      if (q && !(item.make + ' ' + item.model).toLowerCase().includes(q)) return false;
      if (hp && item.currentHp < hp) return false;
      return true;
    });
  }, [cars, myUserId, isDemo, blockedIds, evaluatedIds, category, makeQuery, minHp]);

  const car = discoverCars[index];

  useEffect(() => {
    if (index >= discoverCars.length && index !== 0) setIndex(0);
  }, [discoverCars.length]);

  async function complete(direction: 'left' | 'right') {
    try {
      if (car) {
        const matched = await swipeCar(car.id, direction === 'right' ? 'like' : 'pass');
        if (!isDemo) setEvaluatedIds((current) => current.includes(car.id) ? current : [...current, car.id]);
        if (matched) setTimeout(() => setMatch(true), 220);
      }
    } catch (error: any) {
      Alert.alert('Discover', error?.message ?? 'Não foi possível registrar esta ação.');
    }
    position.setValue({ x: 0, y: 0 });
  }

  function fling(direction: 'left' | 'right') {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? 650 : -650, y: 0 },
      duration: 220,
      useNativeDriver: true,
    }).start(() => { void complete(direction); });
  }

  async function saveCar() {
    if (!car) return;
    try {
      await swipeCar(car.id, 'save');
      if (!isDemo) setEvaluatedIds((current) => current.includes(car.id) ? current : [...current, car.id]);
      position.setValue({ x: 0, y: 0 });
    } catch (error: any) {
      Alert.alert('Salvar', error?.message ?? 'Não foi possível salvar.');
    }
  }

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
    onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.18 }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE) fling('right');
      else if (g.dx < -SWIPE) fling('left');
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
  }), [car?.id, isDemo]);

  const rotate = position.x.interpolate({ inputRange: [-220, 0, 220], outputRange: ['-9deg', '0deg', '9deg'] });

  return (
    <Screen>
      <View style={styles.header}>
        <View><Text style={styles.logo}>APEX</Text><Text style={styles.kicker}>DISCOVER</Text></View>
        <Pressable style={styles.filter} onPress={() => setFilterOpen(true)}><Text style={styles.filterText}>Filtros ⚙</Text></Pressable>
      </View>

      <View style={styles.activeFilters}>
        {category !== 'Todos' && <Text style={styles.activeChip}>{category}</Text>}
        {!!makeQuery && <Text style={styles.activeChip}>{makeQuery}</Text>}
        {!!minHp && <Text style={styles.activeChip}>{minHp}+ cv</Text>}
      </View>

      <View style={styles.stage}>
        {loading ? <View style={styles.empty}><Text style={styles.emptyTitle}>Carregando...</Text></View> : car ? (
          <Animated.View {...panResponder.panHandlers} style={[styles.cardWrap, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}>
            <CarCard car={car} onPress={() => router.push('/car/' + car.id)} />
          </Animated.View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>Nenhum carro para mostrar</Text>
            <Text style={styles.emptyText}>{isDemo ? 'Mude os filtros ou reinicie o modo demo.' : 'Você já avaliou os carros disponíveis ou os filtros estão muito específicos.'}</Text>
            <Pressable onPress={() => { setCategory('Todos'); setMakeQuery(''); setMinHp(''); setEvaluatedIds([]); }} style={styles.reload}><Text style={styles.reloadText}>Limpar filtros/lista</Text></Pressable>
          </View>
        )}
      </View>

      {car && <View style={styles.actions}>
        <Pressable onPress={() => fling('left')} style={styles.action}><Text style={styles.no}>×</Text></Pressable>
        <Pressable onPress={() => { void saveCar(); }} style={[styles.action, styles.small]}><Text style={styles.star}>☆</Text></Pressable>
        <Pressable onPress={() => fling('right')} style={[styles.action, styles.yesButton]}><Text style={styles.yes}>♥</Text></Pressable>
      </View>}

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.filterSheet}>
            <View style={styles.sheetHead}><Text style={styles.sheetTitle}>Filtros</Text><Pressable onPress={() => setFilterOpen(false)}><Text style={styles.close}>×</Text></Pressable></View>
            <Text style={styles.label}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipOn]}><Text style={[styles.categoryText, category === item && styles.categoryTextOn]}>{item}</Text></Pressable>)}
            </ScrollView>
            <Text style={styles.label}>Marca ou modelo</Text>
            <TextInput style={styles.input} value={makeQuery} onChangeText={setMakeQuery} placeholder="Toyota, BMW, Supra..." placeholderTextColor={theme.colors.muted} />
            <Text style={styles.label}>Potência mínima</Text>
            <TextInput style={styles.input} value={minHp} onChangeText={setMinHp} keyboardType="number-pad" placeholder="Ex.: 400" placeholderTextColor={theme.colors.muted} />
            <Pressable style={styles.apply} onPress={() => { setIndex(0); setFilterOpen(false); }}><Text style={styles.applyText}>Aplicar</Text></Pressable>
            <Pressable onPress={() => { setCategory('Todos'); setMakeQuery(''); setMinHp(''); setIndex(0); }}><Text style={styles.clear}>Limpar filtros</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={match} transparent animationType="fade">
        <View style={styles.modalBackdrop}><View style={styles.matchCard}>
          <Text style={styles.matchEyebrow}>GARAGE MATCH</Text>
          <Text style={styles.matchTitle}>Vocês curtiram os carros um do outro. 🏁</Text>
          <Text style={styles.matchSub}>{isDemo ? 'Este match é simulado no modo demo.' : 'O match foi salvo no banco e o chat está liberado para vocês.'}</Text>
          <Pressable style={styles.message} onPress={() => { setMatch(false); router.push(isDemo ? '/chat' : '/matches'); }}><Text style={styles.messageText}>Abrir conversa</Text></Pressable>
          <Pressable onPress={() => setMatch(false)}><Text style={styles.keep}>Continuar descobrindo</Text></Pressable>
        </View></View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' },
  logo: { color: 'white', fontSize: 23, fontWeight: '900', letterSpacing: 4 },
  kicker: { color: theme.colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  filter: { marginLeft: 'auto', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 9 },
  filterText: { color: 'white', fontWeight: '800', fontSize: 12 },
  activeFilters: { minHeight: 28, flexDirection: 'row', gap: 6, paddingHorizontal: 18, paddingBottom: 6 },
  activeChip: { color: '#FF9B7A', backgroundColor: '#2B1812', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5, fontSize: 10, fontWeight: '800' },
  stage: { flex: 1, paddingHorizontal: 14, justifyContent: 'center' },
  cardWrap: { width: '100%' },
  actions: { height: 98, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  action: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  small: { width: 50, height: 50, borderRadius: 25 },
  yesButton: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  no: { color: '#E75A63', fontSize: 42, fontWeight: '300', marginTop: -5 },
  star: { color: '#F5C451', fontSize: 28 },
  yes: { color: 'white', fontSize: 27 },
  empty: { backgroundColor: theme.colors.surface, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border, padding: 30, alignItems: 'center' },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  reload: { marginTop: 18, backgroundColor: theme.colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 99 },
  reloadText: { color: 'white', fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.78)', justifyContent: 'flex-end' },
  filterSheet: { backgroundColor: '#101216', borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 34, borderWidth: 1, borderColor: theme.colors.border },
  sheetHead: { flexDirection: 'row', alignItems: 'center' },
  sheetTitle: { color: 'white', fontSize: 24, fontWeight: '900' },
  close: { marginLeft: 'auto', color: 'white', fontSize: 32 },
  label: { color: '#D8DADE', fontWeight: '800', fontSize: 12, marginTop: 18, marginBottom: 7 },
  categoryRow: { gap: 8 },
  categoryChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  categoryChipOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  categoryText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 },
  categoryTextOn: { color: 'white' },
  input: { backgroundColor: theme.colors.surface2, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 13 },
  apply: { backgroundColor: theme.colors.accent, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 22 },
  applyText: { color: 'white', fontWeight: '900' },
  clear: { color: theme.colors.muted, textAlign: 'center', marginTop: 14, fontWeight: '800' },
  matchCard: { backgroundColor: theme.colors.surface, padding: 26, borderRadius: 28, borderWidth: 1, borderColor: theme.colors.border, margin: 24, marginBottom: 'auto', marginTop: 'auto' },
  matchEyebrow: { color: theme.colors.accent, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  matchTitle: { color: 'white', fontSize: 29, fontWeight: '900', lineHeight: 34, marginTop: 8 },
  matchSub: { color: theme.colors.muted, lineHeight: 21, marginTop: 10 },
  message: { backgroundColor: theme.colors.accent, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 22 },
  messageText: { color: 'white', fontWeight: '900' },
  keep: { color: 'white', textAlign: 'center', fontWeight: '800', marginTop: 18 },
});
