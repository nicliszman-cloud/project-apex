import { FlatList, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function MeetsScreen() {
  const { events, toggleEvent } = useApp();
  return (
    <Screen>
      <View style={styles.header}><View><Text style={styles.title}>Meets</Text><Text style={styles.sub}>Encontre a comunidade fora da tela.</Text></View><Pressable style={styles.map}><Text style={styles.mapText}>Mapa</Text></Pressable></View>
      <View style={styles.filters}>{['Próximos', 'Track', 'JDM', 'Euro'].map((x, i) => <View key={x} style={[styles.filter, i === 0 && styles.filterOn]}><Text style={[styles.filterText, i === 0 && { color: 'white' }]}>{x}</Text></View>)}</View>
      <FlatList data={events} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => (
        <View style={styles.card}><ImageBackground source={{ uri: item.image }} style={styles.photo} imageStyle={styles.photoImg}><View style={styles.shade}/><View style={styles.badge}><Text style={styles.badgeText}>{item.category}</Text></View></ImageBackground><View style={styles.body}><Text style={styles.date}>{item.date}</Text><Text style={styles.eventTitle}>{item.title}</Text><Text style={styles.place}>📍 {item.place} • {item.city}</Text><View style={styles.footer}><Text style={styles.people}>{item.attendees} confirmados</Text><Pressable style={[styles.join, item.joined && styles.joined]} onPress={() => toggleEvent(item.id)}><Text style={styles.joinText}>{item.joined ? 'Confirmado ✓' : 'Eu vou'}</Text></Pressable></View></View></View>
      )} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: 18, flexDirection: 'row', alignItems: 'center' }, title: { color: 'white', fontSize: 30, fontWeight: '900' }, sub: { color: theme.colors.muted, marginTop: 3 }, map: { marginLeft: 'auto', borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99 }, mapText: { color: 'white', fontWeight: '800' }, filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 12 }, filter: { borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 99 }, filterOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent }, filterText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 }, list: { padding: 14, paddingBottom: 28, gap: 14 }, card: { backgroundColor: theme.colors.surface, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border }, photo: { height: 190 }, photoImg: { resizeMode: 'cover' }, shade: { ...StyleSheet.absoluteFillObject as any, backgroundColor: 'rgba(0,0,0,.18)' }, badge: { position: 'absolute', top: 13, left: 13, backgroundColor: 'rgba(0,0,0,.65)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99 }, badgeText: { color: 'white', fontWeight: '900', fontSize: 11 }, body: { padding: 16 }, date: { color: theme.colors.accent, fontWeight: '900', fontSize: 12 }, eventTitle: { color: 'white', fontWeight: '900', fontSize: 21, marginTop: 4 }, place: { color: theme.colors.muted, marginTop: 7 }, footer: { flexDirection: 'row', alignItems: 'center', marginTop: 16 }, people: { color: '#D6D8DC', fontSize: 12, fontWeight: '700' }, join: { marginLeft: 'auto', backgroundColor: theme.colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99 }, joined: { backgroundColor: '#1C6B49' }, joinText: { color: 'white', fontWeight: '900', fontSize: 12 },
});
