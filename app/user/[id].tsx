import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { SectionTabs } from '@/components/SectionTabs';
import { useApp } from '@/context/AppContext';
import { normalizeStoredMediaUrl } from '@/lib/media';
import { openConversation } from '@/lib/messaging';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  cover_url: string | null;
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

const tabs = ['Garagem', 'Posts', 'Eventos'] as const;
type Tab = typeof tabs[number];

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {width}=useWindowDimensions();
  const postCellSize=Math.floor((width-12)/3);
  const { myUserId, posts, events } = useApp();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [cars, setCars] = useState<PublicCar[]>([]);
  const [following, setFollowing] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [tab, setTab] = useState<Tab>('Garagem');
  const mine = id === myUserId;

  const userPosts = useMemo(() => posts.filter((post) => post.authorId === id), [posts, id]);
  const userEvents = useMemo(() => events.filter((event) => event.organizerId === id), [events, id]);

  async function load() {
    if (!supabase || !id) return;
    const [p, c, f1, f2, mineFollow, mineBlock] = await Promise.all([
      supabase.from('profiles').select('id, username, display_name, avatar_url, cover_url, city, state, bio').eq('id', id).single(),
      supabase.from('cars').select('id, make, model, model_year, current_hp, drivetrain, cover_url').eq('owner_id', id).order('created_at', { ascending: false }),
      supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('following_id', id),
      supabase.from('follows').select('following_id', { count: 'exact', head: true }).eq('follower_id', id),
      myUserId ? supabase.from('follows').select('following_id').eq('follower_id', myUserId).eq('following_id', id).maybeSingle() : Promise.resolve({ data: null, error: null }),
      myUserId ? supabase.from('blocks').select('blocked_id').eq('blocker_id', myUserId).eq('blocked_id', id).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);

    let profileRow:any = p.data;
    const missingCover =
      p.error?.code === '42703'
      || p.error?.code === 'PGRST204'
      || /cover_url/i.test(p.error?.message || '');

    if (missingCover) {
      const fallback = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, city, state, bio')
        .eq('id', id)
        .single();
      profileRow = fallback.data ? { ...fallback.data, cover_url: null } : null;
    }

    if (profileRow) setProfile({
      ...profileRow,
      avatar_url: normalizeStoredMediaUrl(profileRow.avatar_url),
      cover_url: normalizeStoredMediaUrl(profileRow.cover_url),
    } as PublicProfile);
    setCars((c.data ?? []).map((row:any)=>({
      ...row,
      cover_url:normalizeStoredMediaUrl(row.cover_url),
    })) as PublicCar[]);
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
    Alert.alert('Denunciar usuário', 'Enviar este perfil para revisão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Denunciar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase!.from('reports').insert({
            reporter_id: myUserId,
            target_user_id: id,
            reason: 'Denúncia enviada pelo perfil público',
          });
          if (error) Alert.alert('Erro', error.message);
          else Alert.alert('Denúncia enviada', 'Recebemos sua denúncia para revisão.');
        },
      },
    ]);
  }

  if (!profile) return <Screen><View style={styles.center}><Text style={styles.muted}>Carregando perfil...</Text></View></Screen>;

  const location = [profile.city, profile.state].filter(Boolean).join(', ') || 'Brasil';
  const hero = profile.cover_url || cars[0]?.cover_url || userPosts[0]?.image || null;

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.cover}>
          {hero ? <AppImage uri={hero} style={StyleSheet.absoluteFill} /> : <View style={styles.coverFallback}><Ionicons name="car-sport-outline" size={48} color={theme.colors.muted2} /></View>}
          <View style={styles.shade} />
          <Pressable style={styles.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={theme.colors.white} /></Pressable>
          {!mine && <Pressable style={styles.more} onPress={report}><Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.white} /></Pressable>}
        </View>

        <View style={styles.identity}>
          <AppImage uri={profile.avatar_url} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{(profile.display_name || 'S')[0].toUpperCase()}</Text>} />
          {mine ? (
            <Pressable style={styles.secondaryButton} onPress={() => router.push('/profile-edit')}><Text style={styles.secondaryText}>Editar perfil</Text></Pressable>
          ) : (
            <View style={styles.actions}>
              <Pressable style={[styles.follow, following && styles.following]} onPress={() => { void toggleFollow(); }}><Text style={styles.followText}>{following ? 'Seguindo' : 'Seguir'}</Text></Pressable>
              <Pressable style={[styles.message, blocked && styles.disabled]} onPress={() => { void message(); }} disabled={blocked}><Ionicons name="chatbubble-outline" size={17} color={theme.colors.text} /></Pressable>
            </View>
          )}
        </View>

        <View style={styles.profileBody}>
          <Text style={styles.name}>{profile.display_name || 'StreetClub Driver'}</Text>
          <Text style={styles.handle}>{profile.username ? '@' + profile.username : '@streetclub'} · {location}</Text>
          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          <View style={styles.stats}>
            <Stat value={userPosts.length} label="posts" />
            <Stat value={followers} label="seguidores" />
            <Stat value={followingCount} label="seguindo" />
          </View>
        </View>

        {!mine && (
          <View style={styles.safety}>
            <Pressable onPress={() => { void toggleBlock(); }}><Text style={styles.safetyText}>{blocked ? 'Desbloquear usuário' : 'Bloquear usuário'}</Text></Pressable>
          </View>
        )}

        <View style={styles.tabs}><SectionTabs items={tabs} value={tab} onChange={setTab} /></View>

        {blocked ? (
          <View style={styles.blocked}><Ionicons name="eye-off-outline" size={28} color={theme.colors.muted2} /><Text style={styles.muted}>O conteúdo deste usuário está oculto.</Text></View>
        ) : tab === 'Garagem' ? (
          cars.length === 0 ? <Empty icon="car-sport-outline" text="Nenhum carro cadastrado." /> :
          <View style={styles.carGrid}>{cars.map((car) => (
            <Pressable key={car.id} style={styles.carCard} onPress={() => router.push('/car/' + car.id)}>
              <AppImage uri={car.cover_url} style={styles.carImage} placeholder={<Ionicons name="car-sport-outline" size={26} color={theme.colors.muted2} />} />
              <View style={styles.carBody}><Text style={styles.carTitle} numberOfLines={1}>{car.make} {car.model}</Text><Text style={styles.carMeta}>{car.model_year || '—'} · {car.current_hp || 0} cv · {car.drivetrain || '—'}</Text></View>
            </Pressable>
          ))}</View>
        ) : tab === 'Posts' ? (
          userPosts.length === 0 ? <Empty icon="images-outline" text="Nenhuma publicação ainda." /> :
          <View style={styles.postGrid}>{userPosts.map((post) => <Pressable key={post.id} style={[styles.postCell,{width:postCellSize,height:postCellSize}]} onPress={() => router.push('/post/' + post.id)}><AppImage uri={post.image} style={StyleSheet.absoluteFill} placeholder={<Ionicons name="image-outline" size={24} color={theme.colors.muted2}/>}/></Pressable>)}</View>
        ) : (
          userEvents.length === 0 ? <Empty icon="calendar-outline" text="Nenhum evento criado." /> :
          userEvents.map((event) => (
            <Pressable key={event.id} style={styles.eventRow} onPress={() => router.push('/event/' + event.id)}>
              <AppImage uri={event.image} style={styles.eventImage} />
              <View style={styles.eventInfo}><Text style={styles.eventDate}>{event.date}</Text><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.eventMeta}>{event.place} · {event.city}</Text></View>
              <Ionicons name="chevron-forward" size={17} color={theme.colors.muted2} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function Empty({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return <View style={styles.empty}><Ionicons name={icon} size={31} color={theme.colors.muted2} /><Text style={styles.muted}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  cover: { height: 164, backgroundColor: theme.colors.surface, overflow: 'hidden' },
  coverFallback: { ...StyleSheet.absoluteFill, backgroundColor: '#0A0B0D', alignItems: 'center', justifyContent: 'center' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,.42)' },
  back: { position: 'absolute', top: 12, left: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(5,5,6,.68)', alignItems: 'center', justifyContent: 'center' },
  more: { position: 'absolute', top: 12, right: 12, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(5,5,6,.68)', alignItems: 'center', justifyContent: 'center' },
  identity: { paddingHorizontal: 16, marginTop: -38, flexDirection: 'row', alignItems: 'flex-end' },
  avatar: { width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: theme.colors.background },
  avatarText: { color: theme.colors.text, fontSize: 28, fontWeight: '900' },
  actions: { marginLeft: 'auto', flexDirection: 'row', gap: 8, marginBottom: 4 },
  follow: { height: 36, minWidth: 92, paddingHorizontal: 14, borderRadius: 18, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  following: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.borderStrong },
  followText: { color: theme.colors.white, fontSize: 10.5, fontWeight: '900' },
  message: { width: 38, height: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: .35 },
  secondaryButton: { marginLeft: 'auto', marginBottom: 4, height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: theme.colors.text, fontSize: 10.5, fontWeight: '900' },
  profileBody: { paddingHorizontal: 16, paddingTop: 10 },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '900' },
  handle: { color: theme.colors.muted, fontSize: 10.5, marginTop: 3 },
  bio: { color: theme.colors.textSoft, fontSize: 12, lineHeight: 18, marginTop: 10 },
  stats: { flexDirection: 'row', gap: 28, marginTop: 17 },
  statValue: { color: theme.colors.text, fontSize: 16.5, fontWeight: '900' },
  statLabel: { color: theme.colors.muted, fontSize: 9.5, marginTop: 2 },
  safety: { paddingHorizontal: 16, paddingTop: 13 },
  safetyText: { color: theme.colors.danger, fontSize: 9.5, fontWeight: '800' },
  tabs: { marginTop: 15, borderTopWidth: 1, borderTopColor: theme.colors.border, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  carGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 14 },
  carCard: { width: '48.5%', borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, overflow: 'hidden', backgroundColor: theme.colors.surface },
  carImage: { width: '100%', height: 116 },
  carBody: { padding: 9 },
  carTitle: { color: theme.colors.text, fontSize: 12.5, fontWeight: '900' },
  carMeta: { color: theme.colors.muted, fontSize: 9, marginTop: 4 },
  postGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, padding: 3 },
  postCell: { backgroundColor: theme.colors.surface2, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  eventRow: { minHeight: 80, marginHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  eventImage: { width: 62, height: 62, borderRadius: 11 },
  eventInfo: { flex: 1, marginLeft: 10 },
  eventDate: { color: theme.colors.accent, fontSize: 8.5, fontWeight: '900' },
  eventTitle: { color: theme.colors.text, fontSize: 12.5, fontWeight: '900', marginTop: 3 },
  eventMeta: { color: theme.colors.muted, fontSize: 9, marginTop: 3 },
  empty: { margin: 16, padding: 28, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, alignItems: 'center', gap: 9 },
  blocked: { margin: 16, padding: 28, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, alignItems: 'center', gap: 9 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted, fontSize: 11, textAlign: 'center' },
});
