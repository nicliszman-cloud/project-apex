import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrandLogo } from '@/components/BrandLogo';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function MenuScreen() {
  const { profile, signOut } = useApp();

  async function logout() {
    await signOut();
    router.replace('/auth');
  }

  const items: Array<{ icon: React.ComponentProps<typeof Ionicons>['name']; label: string; action: () => void }> = [
    { icon: 'person-outline', label: 'Meu perfil', action: () => router.push('/(tabs)/garage') },
    { icon: 'car-sport-outline', label: 'Minha garagem', action: () => router.push({ pathname: '/(tabs)/garage', params: { section: 'Garagem' } }) },
    { icon: 'images-outline', label: 'Meus posts', action: () => router.push({ pathname: '/(tabs)/garage', params: { section: 'Posts' } }) },
    { icon: 'pricetags-outline', label: 'Meus anúncios', action: () => router.push({ pathname: '/(tabs)/marketplace', params: { mine: '1' } }) },
    { icon: 'calendar-outline', label: 'Meus eventos', action: () => router.push({ pathname: '/(tabs)/garage', params: { section: 'Eventos' } }) },
    { icon: 'chatbubbles-outline', label: 'Mensagens', action: () => router.push('/(tabs)/inbox') },
    { icon: 'notifications-outline', label: 'Notificações', action: () => router.push('/notifications') },
    { icon: 'settings-outline', label: 'Configurações', action: () => router.push('/profile-edit') },
    { icon: 'help-circle-outline', label: 'Ajuda e suporte', action: () => router.push('/support') },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <BrandLogo size={27} />
          <Pressable onPress={() => router.back()} style={styles.close}><Ionicons name="close" size={22} color={theme.colors.text} /></Pressable>
        </View>

        <View style={styles.profile}>
          <AppImage uri={profile?.avatarUrl} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{(profile?.displayName || 'S')[0].toUpperCase()}</Text>} />
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{profile?.displayName || 'StreetClub Driver'}</Text>
            <Text style={styles.handle}>{profile?.username ? '@' + profile.username : '@streetclub'}</Text>
          </View>
        </View>

        <View style={styles.menu}>
          {items.map((item) => (
            <Pressable key={item.label} style={styles.row} onPress={item.action}>
              <Ionicons name={item.icon} size={20} color={theme.colors.textSoft} />
              <Text style={styles.label}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.muted2} />
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.logout} onPress={() => { void logout(); }}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.accent} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>

        <Text style={styles.footer}>ENTRE PARA A CULTURA</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { minHeight: '100%', paddingBottom: 34 },
  header: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  close: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  profile: { marginHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  avatar: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: '#4E1116' },
  avatarText: { color: theme.colors.text, fontSize: 20, fontWeight: '900' },
  profileCopy: { marginLeft: 12 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
  handle: { color: theme.colors.muted, fontSize: 10.5, marginTop: 3 },
  menu: { paddingHorizontal: 12, paddingTop: 8 },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  label: { color: theme.colors.textSoft, flex: 1, fontSize: 12, fontWeight: '800' },
  logout: { marginHorizontal: 16, marginTop: 24, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14 },
  logoutText: { color: theme.colors.accent, fontSize: 12, fontWeight: '900' },
  footer: { color: theme.colors.muted2, fontSize: 8.5, letterSpacing: 4, textAlign: 'center', marginTop: 'auto', paddingTop: 28 },
});
