import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function MeetsScreen() {
  const { events, toggleEvent } = useApp();

  async function attendance(id: string) {
    try {
      await toggleEvent(id);
    } catch (error: any) {
      Alert.alert('Evento', error?.message ?? 'Não foi possível atualizar sua presença.');
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View><Text style={styles.title}>Meets</Text><Text style={styles.sub}>Encontre a comunidade fora da tela.</Text></View>
        <Pressable style={styles.create} onPress={() => router.push('/(tabs)/create')}><Text style={styles.createText}>＋ Criar</Text></Pressable>
      </View>
      <View style={styles.filters}>{['Próximos', 'Track', 'JDM', 'Euro'].map((x, i) => <View key={x} style={[styles.filter, i === 0 && styles.filterOn]}><Text style={[styles.filterText, i === 0 && { color: 'white' }]}>{x}</Text></View>)}</View>

      {events.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyIcon}>📍</Text><Text style={styles.emptyTitle}>Nenhum evento cadastrado ainda</Text><Text style={styles.emptyText}>Crie o primeiro meet, track day ou exposição da comunidade.</Text><Pressable style={styles.emptyButton} onPress={() => router.push('/(tabs)/create')}><Text style={styles.emptyButtonText}>Criar evento</Text></Pressable></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => router.push('/event/' + item.id)}>
              <View style={styles.photo}>
                <AppImage uri={item.image} style={StyleSheet.absoluteFill} placeholder={<Text style={styles.eventPhotoPlaceholder}>📍</Text>} />
                <View style={styles.shade}/><View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View>
              </View>
              <View style={styles.body}>
                <Text style={styles.date}>{item.date}</Text>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.place}>📍 {item.place} • {item.city}</Text>
                {!!item.description && <Text style={styles.description} numberOfLines={2}>{item.description}</Text>}
                <View style={styles.footer}><Text style={styles.people}>{item.attendees} confirmados</Text><Pressable style={[styles.join, item.joined && styles.joined]} onPress={() => { void attendance(item.id); }}><Text style={styles.joinText}>{item.joined ? 'Confirmado ✓' : 'Eu vou'}</Text></Pressable></View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18, flexDirection: 'row', alignItems: 'center' },
  title: { color: 'white', fontSize: 30, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 3 },
  create: { marginLeft: 'auto', borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99 },
  createText: { color: 'white', fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 },
  filter: { borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99 },
  filterOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  filterText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 },
  list: { padding: 14, paddingBottom: 28, gap: 14 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  photo: { height: 190 },
  eventPhotoPlaceholder: { fontSize: 42 },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.18)' },
  badge: { position: 'absolute', top: 13, left: 13, backgroundColor: 'rgba(0,0,0,.65)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99 },
  badgeText: { color: 'white', fontWeight: '900', fontSize: 11 },
  body: { padding: 16 },
  date: { color: theme.colors.accent, fontWeight: '900', fontSize: 12 },
  eventTitle: { color: 'white', fontWeight: '900', fontSize: 21, marginTop: 4 },
  place: { color: theme.colors.muted, marginTop: 7 },
  description: { color: '#D8DADE', lineHeight: 19, marginTop: 9 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  people: { color: '#D6D8DC', fontSize: 12, fontWeight: '700' },
  join: { marginLeft: 'auto', backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99 },
  joined: { backgroundColor: '#1C6B49' },
  joinText: { color: 'white', fontWeight: '900', fontSize: 12 },
  empty: { margin: 18, padding: 28, backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  emptyButton: { backgroundColor: theme.colors.accent, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, marginTop: 16 },
  emptyButtonText: { color: 'white', fontWeight: '900' },
});
