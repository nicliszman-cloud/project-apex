import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { openConversation } from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
};

type PublicCar = {
  id: string;
  make: string;
  model: string;
  model_year: number | null;
  current_hp: number | null;
  drivetrain: string | null;
  cover_url: string | null;
};

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { myUserId } = useApp();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [cars, setCars] = useState<PublicCar[]>([]);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const mine = id === myUserId;

  async function load() {
    if (!supabase || !id) return;
    const [p, c, f1, f2, mineFollow, mineBlock] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, avatar_url, city, state, bio').eq('id', id).single(),
      supabase.from('cars').select('id, make, model, model_year, current_hp, drivetrain, cover_url').eq('owner_id', id).order('created_at', { ascending: false }),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', id),
      myUserId ? supabase.from('follows').select('following_id').eq('follower_id', myUserId).eq('following_id', id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      myUserId ? supabase.from('blocks').select('blocked_id').eq('blocker_id', myUserId).eq('blocked_id', id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    if (p.data) setProfile(p.data as PublicProfile);
    setCars((c.data ?? []) as PublicCar[]);
    setFollowers(f1.count ?? 0);
    setFollowingCount(f2.count ?? 0);
    setFollowing(Boolean(mineFollow.data));
    setBlocked(Boolean(mineBlock.data));
  }

  useEffect(() => { void load(); }, [id, myUserId]);

  async function toggleFollow() {
    if (!supabase || !myUserId || mine) return;
    const result = following
      ? await supabase.from('follows').delete().eq('follower_id', myUserId).eq('following_id', id)
      : await supabase.from('follows').insert({ follower_id: myUserId, following_id: id });
    if (result.error) return Alert.alert('Seguir', result.error.message);
    await load();
  }

  async function message() {
    if (!id || mine || blocked) return;
    try {
      const conversationId = await openConversation(id);
      router.push({ pathname: '/chat', params: { conversationId } });
    } catch (error: any) {
      Alert.alert('Mensagem', error?.message ?? 'Não foi possível abrir a conversa.');
    }
  }

  async function toggleBlock() {
    if (!supabase || !myUserId || mine) return;
    const result = blocked
      ? await supabase.from('blocks').delete().eq('blocker_id', myUserId).eq('blocked_id', id)
      : await supabase.from('blocks').insert({ blocker_id: myUserId, blocked_id: id });
    if (result.error) return Alert.alert('Bloquear', result.error.message);
    setBlocked(!blocked);
  }

  function report() {
    if (!supabase || !myUserId || mine) return;
    Alert.alert('Denunciar usuário', 'Enviar uma denúncia por comportamento inadequado?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Denunciar', style: 'destructive', onPress: async () => {
        const { error } = await supabase!.from('reports').insert({
          reporter_id: myUserId,
          target_user_id: id,
          reason: 'Denúncia enviada pelo perfil público',
        });
        if (error) Alert.alert('Erro', error.message);
        else Alert.alert('Denúncia enviada', 'Obrigado. O conteúdo poderá ser revisado pela moderação.');
      }},
    ]);
  }

  if (!profile) return <Screen><View style={styles.center}><Text style={styles.muted}>Carregando perfil...</Text></View></Screen>;

  const location = [profile.city, profile.state].filter(Boolean).join(' • ') || 'Local não informado';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.topTitle}>Perfil</Text></View>

        <View style={styles.identity}>
          <AppImage uri={profile.avatar_url} style={styles.avatarImage} placeholder={<Text style={styles.avatarText}>{(profile.display_name || 'A')[0]}</Text>} />
          <View style={{ flex: 1 }}><Text style={styles.name}>{profile.display_name || 'Driver'}</Text><Text style={styles.handle}>{profile.username ? '@' + profile.username : '@driver'} • {location}</Text></View>
        </View>

        {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        <View style={styles.stats}>
          <View><Text style={styles.stat}>{cars.length}</Text><Text style={styles.statLabel}>carros</Text></View>
          <View><Text style={styles.stat}>{followers}</Text><Text style={styles.statLabel}>seguidores</Text></View>
          <View><Text style={styles.stat}>{followingCount}</Text><Text style={styles.statLabel}>seguindo</Text></View>
        </View>

        {mine ? <Pressable style={styles.primary} onPress={() => router.push('/profile-edit')}><Text style={styles.primaryText}>Editar meu perfil</Text></Pressable> : (
          <>
            <View style={styles.actions}>
              <Pressable style={[styles.primary, styles.flex, following && styles.following]} onPress={() => { void toggleFollow(); }}><Text style={styles.primaryText}>{following ? 'Seguindo ✓' : 'Seguir'}</Text></Pressable>
              <Pressable style={[styles.message, styles.flex, blocked && styles.disabled]} onPress={() => { void message(); }} disabled={blocked}><Text style={styles.messageText}>💬 Mensagem</Text></Pressable>
            </View>
            <View style={styles.safetyRow}>
              <Pressable onPress={() => { void toggleBlock(); }}><Text style={styles.safety}>{blocked ? 'Desbloquear' : 'Bloquear'}</Text></Pressable>
              <Text style={styles.separator}>•</Text>
              <Pressable onPress={report}><Text style={styles.report}>Denunciar usuário</Text></Pressable>
            </View>
          </>
        )}

        <Text style={styles.section}>Garagem</Text>
        {blocked ? <View style={styles.blocked}><Text style={styles.muted}>Você bloqueou este usuário. O conteúdo dele está oculto.</Text></View> :
          cars.length === 0 ? <Text style={styles.muted}>Nenhum carro cadastrado.</Text> :
          cars.map((car) => <Pressable key={car.id} style={styles.car} onPress={() => router.push('/car/' + car.id)}>
            <AppImage uri={car.cover_url} style={styles.carImage} placeholder={<Text style={styles.carIcon}>🏎️</Text>} />
            <View style={styles.carBody}><Text style={styles.carTitle}>{car.make} {car.model}</Text><Text style={styles.carMeta}>{car.model_year || '—'} • {car.current_hp || 0} cv • {car.drivetrain || '—'}</Text></View>
          </Pressable>)
        }
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  top: { flexDirection: 'row', alignItems: 'center' },
  back: { color: 'white', fontSize: 38, marginRight: 10, marginTop: -4 },
  topTitle: { color: 'white', fontSize: 25, fontWeight: '900' },
  identity: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  avatarImage: { width: 76, height: 76, borderRadius: 25 },
  avatarText: { color: 'white', fontWeight: '900', fontSize: 30 },
  name: { color: 'white', fontSize: 24, fontWeight: '900', marginLeft: 14 },
  handle: { color: theme.colors.muted, marginLeft: 14, marginTop: 4, fontSize: 12 },
  bio: { color: '#D8DADE', lineHeight: 20, marginTop: 15 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, paddingVertical: 16, marginTop: 20 },
  stat: { color: 'white', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  statLabel: { color: theme.colors.muted, fontSize: 11, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  flex: { flex: 1, marginTop: 0 },
  primary: { backgroundColor: theme.colors.accent, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 16 },
  following: { backgroundColor: '#1C6B49' },
  primaryText: { color: 'white', fontWeight: '900' },
  message: { backgroundColor: theme.colors.surface2, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  messageText: { color: 'white', fontWeight: '900' },
  disabled: { opacity: 0.4 },
  safetyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 13 },
  safety: { color: '#D8DADE', fontWeight: '800', fontSize: 12 },
  separator: { color: theme.colors.muted },
  report: { color: '#F07880', fontWeight: '800', fontSize: 12 },
  section: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 28, marginBottom: 12 },
  car: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, overflow: 'hidden', marginBottom: 12 },
  carImage: { width: '100%', height: 190 },
  carIcon: { fontSize: 40 },
  carBody: { padding: 13 },
  carTitle: { color: 'white', fontWeight: '900', fontSize: 18 },
  carMeta: { color: theme.colors.muted, marginTop: 4 },
  blocked: { padding: 20, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
});
