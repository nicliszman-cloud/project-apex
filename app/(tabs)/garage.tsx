import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function GarageScreen() {
  const { cars, profile, myUserId, isDemo, loading, matches } = useApp();
  const mine = cars.filter((c) => c.ownerId === myUserId);
  const location = [profile?.city, profile?.state].filter(Boolean).join(' • ') || 'Localização não informada';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          <AppImage uri={profile?.avatarUrl} style={styles.avatarImage} placeholder={<Text style={styles.avatarText}>{(profile?.displayName || 'A')[0].toUpperCase()}</Text>} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{profile?.displayName || 'Seu perfil'}</Text>
            <Text style={styles.handle}>{profile?.username ? '@' + profile.username : '@defina_seu_username'} • {location}</Text>
          </View>
          <Pressable style={styles.settings} onPress={() => router.push('/profile-edit')}><Text>⚙️</Text></Pressable>
        </View>

        {!!profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        {isDemo && <View style={styles.demo}><Text style={styles.demoText}>MODO DEMO</Text></View>}

        <View style={styles.stats}>
          <View><Text style={styles.statNum}>{mine.length}</Text><Text style={styles.statLabel}>carros</Text></View>
          <Pressable onPress={() => router.push('/matches')}><Text style={styles.statNum}>{matches.length}</Text><Text style={styles.statLabel}>matches</Text></Pressable>
          <View><Text style={styles.statNum}>—</Text><Text style={styles.statLabel}>meets</Text></View>
        </View>

        <View style={styles.quickRow}>
          <Pressable style={styles.quick} onPress={() => router.push('/inbox')}><Text style={styles.quickIcon}>💬</Text><Text style={styles.quickText}>Mensagens</Text></Pressable>
          <Pressable style={styles.quick} onPress={() => router.push('/marketplace')}><Text style={styles.quickIcon}>🔧</Text><Text style={styles.quickText}>Peças</Text></Pressable>
          <Pressable style={styles.quick} onPress={() => router.push('/notifications')}><Text style={styles.quickIcon}>🔔</Text><Text style={styles.quickText}>Notificações</Text></Pressable>
        </View>

        <Pressable style={styles.publicProfile} onPress={() => myUserId && router.push('/user/' + myUserId)}>
          <Text style={styles.publicProfileText}>Ver meu perfil público</Text><Text style={styles.publicProfileArrow}>›</Text>
        </Pressable>

        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Minha garagem</Text><Pressable onPress={() => router.push('/(tabs)/create')}><Text style={styles.add}>＋ Adicionar</Text></Pressable></View>

        {loading ? <Text style={styles.emptyText}>Carregando sua garagem...</Text> : mine.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyIcon}>🏎️</Text><Text style={styles.emptyTitle}>Sua garagem está vazia</Text><Text style={styles.emptyText}>Cadastre seu primeiro carro com fotos, ficha técnica e build.</Text><Pressable style={styles.emptyButton} onPress={() => router.push('/(tabs)/create')}><Text style={styles.emptyButtonText}>Adicionar primeiro carro</Text></Pressable></View>
        ) : mine.map((car) => (
          <Pressable key={car.id} style={styles.car} onPress={() => router.push('/car/' + car.id)}>
            <AppImage uri={car.image} style={styles.carImage} placeholder={<Text style={styles.carIcon}>🏎️</Text>} />
            <View style={styles.carInfo}><Text style={styles.carTitle}>{car.make} {car.model}</Text><Text style={styles.carMeta}>{car.year} • {car.currentHp} cv • {car.drivetrain} • {car.category}</Text><Text style={styles.build}>{car.modifications.length ? car.modifications.slice(0, 3).join('  •  ') : 'Projeto sem modificações cadastradas'}</Text></View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 36 },
  profile: { flexDirection: 'row', alignItems: 'center' },
  avatarImage: { width: 64, height: 64, borderRadius: 22 },
  avatarText: { color: 'white', fontWeight: '900', fontSize: 26 },
  name: { color: 'white', fontSize: 24, fontWeight: '900', marginLeft: 14 },
  handle: { color: theme.colors.muted, marginLeft: 14, marginTop: 3, fontSize: 12 },
  settings: { width: 42, height: 42, borderRadius: 15, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  bio: { color: '#D7DADE', lineHeight: 20, marginTop: 14 },
  demo: { alignSelf: 'flex-start', backgroundColor: '#31251A', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, marginTop: 12 },
  demoText: { color: '#F5C451', fontWeight: '900', fontSize: 9, letterSpacing: 1 },
  stats: { marginTop: 22, backgroundColor: theme.colors.surface, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
  statNum: { color: 'white', fontWeight: '900', fontSize: 19, textAlign: 'center' },
  statLabel: { color: theme.colors.muted, fontSize: 11, marginTop: 3 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quick: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 12, alignItems: 'center' },
  quickIcon: { fontSize: 20 },
  quickText: { color: 'white', fontWeight: '800', fontSize: 10, marginTop: 5, textAlign: 'center' },
  publicProfile: { flexDirection: 'row', alignItems: 'center', marginTop: 9, padding: 13, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15 },
  publicProfileText: { color: '#D7DADE', fontWeight: '800' },
  publicProfileArrow: { color: theme.colors.muted, fontSize: 24, marginLeft: 'auto' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  sectionTitle: { color: 'white', fontSize: 19, fontWeight: '900' },
  add: { color: theme.colors.accent, fontWeight: '900', marginLeft: 'auto' },
  car: { borderRadius: 22, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 14 },
  carImage: { width: '100%', height: 225 },
  carIcon: { fontSize: 44 },
  carInfo: { padding: 15 },
  carTitle: { color: 'white', fontSize: 21, fontWeight: '900' },
  carMeta: { color: '#D6D8DC', marginTop: 5, fontWeight: '700' },
  build: { color: theme.colors.muted, marginTop: 8, fontSize: 12 },
  empty: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 22, padding: 24, alignItems: 'center' },
  emptyIcon: { fontSize: 42 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 10 },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 7 },
  emptyButton: { backgroundColor: theme.colors.accent, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, marginTop: 17 },
  emptyButtonText: { color: 'white', fontWeight: '900' },
});
