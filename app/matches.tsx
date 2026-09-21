import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function MatchesScreen() {
  const { matches, isDemo } = useApp();

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <View><Text style={styles.title}>Garage Matches</Text><Text style={styles.sub}>Conversas liberadas quando a curtida é mútua.</Text></View>
      </View>

      {matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔥</Text>
          <Text style={styles.emptyTitle}>{isDemo ? 'Faça o match demo no Discover' : 'Nenhum match ainda'}</Text>
          <Text style={styles.emptyText}>Quando duas pessoas curtirem os carros uma da outra, o match aparecerá aqui.</Text>
          <Pressable style={styles.discover} onPress={() => router.replace('/(tabs)/discover')}><Text style={styles.discoverText}>Ir para Discover</Text></Pressable>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.match} onPress={() => router.push({ pathname: '/chat', params: { matchId: item.id } })}>
              {item.partnerCarImage ? <Image source={{ uri: item.partnerCarImage }} style={styles.image} /> : <View style={styles.imageFallback}><Text>🏎️</Text></View>}
              <View style={styles.info}><Text style={styles.name}>{item.partnerName}</Text><Text style={styles.car}>{item.partnerCarName}</Text><Text style={styles.hint}>Toque para conversar</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: 'white', fontSize: 38, marginRight: 12, marginTop: -4 },
  title: { color: 'white', fontSize: 25, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 3, fontSize: 11 },
  list: { padding: 14, gap: 10 },
  match: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, padding: 10 },
  image: { width: 72, height: 72, borderRadius: 14 },
  imageFallback: { width: 72, height: 72, borderRadius: 14, backgroundColor: theme.colors.surface2, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { color: 'white', fontSize: 17, fontWeight: '900' },
  car: { color: '#D6D8DC', marginTop: 3, fontWeight: '700' },
  hint: { color: theme.colors.muted, fontSize: 11, marginTop: 5 },
  chevron: { color: theme.colors.muted, fontSize: 28, paddingHorizontal: 8 },
  empty: { margin: 18, padding: 28, backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { color: 'white', fontSize: 21, fontWeight: '900', marginTop: 9 },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  discover: { backgroundColor: theme.colors.accent, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, marginTop: 16 },
  discoverText: { color: 'white', fontWeight: '900' },
});
