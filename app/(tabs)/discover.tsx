import { useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { CarCard } from '@/components/CarCard';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

const SWIPE = Dimensions.get('window').width * 0.28;

export default function DiscoverScreen() {
  const { cars, swipeCar, myUserId, isDemo, loading } = useApp();
  const discoverCars = isDemo ? cars : cars.filter((item) => item.ownerId !== myUserId);
  const [index, setIndex] = useState(0);
  const [match, setMatch] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  const car = discoverCars[index];

  async function complete(direction: 'left' | 'right') {
    try {
      if (car) {
        const matched = await swipeCar(car.id, direction === 'right' ? 'like' : 'pass');
        if (matched) setTimeout(() => setMatch(true), 220);
      }
    } catch (error: any) {
      Alert.alert('Discover', error?.message ?? 'Não foi possível registrar esta ação.');
    }
    setIndex((value) => value + 1);
    position.setValue({ x: 0, y: 0 });
  }

  function fling(direction: 'left' | 'right') {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? 650 : -650, y: 0 },
      duration: 220,
      useNativeDriver: true,
    }).start(() => { void complete(direction); });
  }

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8,
    onPanResponderMove: (_, g) => position.setValue({ x: g.dx, y: g.dy * 0.18 }),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE) fling('right');
      else if (g.dx < -SWIPE) fling('left');
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
  }), [car?.id]);

  const rotate = position.x.interpolate({ inputRange: [-220, 0, 220], outputRange: ['-9deg', '0deg', '9deg'] });

  return (
    <Screen>
      <View style={styles.header}>
        <View><Text style={styles.logo}>APEX</Text><Text style={styles.kicker}>DISCOVER</Text></View>
        <Pressable style={styles.filter}><Text style={styles.filterText}>Filtros ⚙</Text></Pressable>
      </View>

      <View style={styles.stage}>
        {loading ? <View style={styles.empty}><Text style={styles.emptyTitle}>Carregando...</Text></View> : car ? (
          <Animated.View {...panResponder.panHandlers} style={[styles.cardWrap, { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}>
            <CarCard car={car} onPress={() => router.push('/car/' + car.id)} />
          </Animated.View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏁</Text>
            <Text style={styles.emptyTitle}>{isDemo ? 'Você chegou ao fim.' : 'Ainda não há novos carros.'}</Text>
            <Text style={styles.emptyText}>{isDemo ? 'Reinicie a lista para ver os carros demo novamente.' : 'Carros que você já avaliou não voltam para a frente da fila nesta sessão. Novos projetos aparecerão aqui.'}</Text>
            {isDemo ? <Pressable onPress={() => setIndex(0)} style={styles.reload}><Text style={styles.reloadText}>Ver novamente</Text></Pressable> : <Pressable onPress={() => router.push('/(tabs)/create')} style={styles.reload}><Text style={styles.reloadText}>Cadastrar meu carro</Text></Pressable>}
          </View>
        )}
      </View>

      {car && <View style={styles.actions}>
        <Pressable onPress={() => fling('left')} style={styles.action}><Text style={styles.no}>×</Text></Pressable>
        <Pressable onPress={() => { void swipeCar(car.id, 'save'); }} style={[styles.action, styles.small]}><Text style={styles.star}>☆</Text></Pressable>
        <Pressable onPress={() => fling('right')} style={[styles.action, styles.yesButton]}><Text style={styles.yes}>♥</Text></Pressable>
      </View>}

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
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center' },
  logo: { color: 'white', fontSize: 23, fontWeight: '900', letterSpacing: 4 },
  kicker: { color: theme.colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  filter: { marginLeft: 'auto', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 9 },
  filterText: { color: 'white', fontWeight: '800', fontSize: 12 },
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
  emptyTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 14 },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  reload: { marginTop: 18, backgroundColor: theme.colors.accent, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 99 },
  reloadText: { color: 'white', fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)', justifyContent: 'center', padding: 24 },
  matchCard: { backgroundColor: theme.colors.surface, padding: 26, borderRadius: 28, borderWidth: 1, borderColor: theme.colors.border },
  matchEyebrow: { color: theme.colors.accent, fontWeight: '900', letterSpacing: 2, fontSize: 12 },
  matchTitle: { color: 'white', fontSize: 29, fontWeight: '900', lineHeight: 34, marginTop: 8 },
  matchSub: { color: theme.colors.muted, lineHeight: 21, marginTop: 10 },
  message: { backgroundColor: theme.colors.accent, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 22 },
  messageText: { color: 'white', fontWeight: '900' },
  keep: { color: 'white', textAlign: 'center', fontWeight: '800', marginTop: 18 },
});
