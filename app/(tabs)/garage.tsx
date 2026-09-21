import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function GarageScreen() {
  const { cars } = useApp();
  const mine = cars.filter((c) => c.ownerId === 'me');
  const featured = mine[0] ?? { ...cars[1], ownerId: 'me', ownerName: 'Você' };
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}><View style={styles.avatar}><Text style={styles.avatarText}>V</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>Sua garagem</Text><Text style={styles.handle}>@driver • Brasil</Text></View><Pressable style={styles.settings}><Text>⚙️</Text></Pressable></View>
        <View style={styles.stats}><View><Text style={styles.statNum}>{mine.length || 1}</Text><Text style={styles.statLabel}>carros</Text></View><View><Text style={styles.statNum}>248</Text><Text style={styles.statLabel}>seguidores</Text></View><View><Text style={styles.statNum}>12</Text><Text style={styles.statLabel}>meets</Text></View></View>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Minha garagem</Text><Pressable onPress={() => router.push('/(tabs)/create')}><Text style={styles.add}>＋ Adicionar</Text></Pressable></View>
        <Pressable style={styles.car} onPress={() => router.push(`/car/${featured.id}`)}><Image source={{ uri: featured.image }} style={styles.carImage}/><View style={styles.carInfo}><Text style={styles.carTitle}>{featured.make} {featured.model}</Text><Text style={styles.carMeta}>{featured.year} • {featured.currentHp} cv • {featured.drivetrain}</Text><Text style={styles.build}>{featured.modifications.slice(0, 3).join('  •  ')}</Text></View></Pressable>
        <Text style={styles.sectionTitle}>Conquistas</Text><View style={styles.badges}><View style={styles.achievement}><Text style={styles.bigEmoji}>🏁</Text><Text style={styles.aTitle}>Primeiro Meet</Text></View><View style={styles.achievement}><Text style={styles.bigEmoji}>🔥</Text><Text style={styles.aTitle}>Garage Match</Text></View><View style={styles.achievement}><Text style={styles.bigEmoji}>🔧</Text><Text style={styles.aTitle}>Build Log</Text></View></View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 36 }, profile: { flexDirection: 'row', alignItems: 'center' }, avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: 'white', fontWeight: '900', fontSize: 26 }, name: { color: 'white', fontSize: 24, fontWeight: '900', marginLeft: 14 }, handle: { color: theme.colors.muted, marginLeft: 14, marginTop: 3 }, settings: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }, stats: { marginTop: 22, backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 }, statNum: { color: 'white', fontWeight: '900', fontSize: 19, textAlign: 'center' }, statLabel: { color: theme.colors.muted, fontSize: 11, marginTop: 3 }, sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 12 }, sectionTitle: { color: 'white', fontSize: 19, fontWeight: '900', marginTop: 24, marginBottom: 12 }, add: { color: theme.colors.accent, fontWeight: '900', marginLeft: 'auto' }, car: { borderRadius: 22, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }, carImage: { width: '100%', height: 225 }, carInfo: { padding: 15 }, carTitle: { color: 'white', fontSize: 21, fontWeight: '900' }, carMeta: { color: '#D6D8DC', marginTop: 5, fontWeight: '700' }, build: { color: theme.colors.muted, marginTop: 8, fontSize: 12 }, badges: { flexDirection: 'row', gap: 9 }, achievement: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 12, alignItems: 'center' }, bigEmoji: { fontSize: 26 }, aTitle: { color: 'white', fontWeight: '800', fontSize: 10, textAlign: 'center', marginTop: 7 },
});
