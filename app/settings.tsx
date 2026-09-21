import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function SettingsScreen() {
  const { myUserId, signOut } = useApp();

  async function collectStorageFiles(path: string): Promise<string[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.storage.from('media').list(path, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;

    const files: string[] = [];
    for (const item of data ?? []) {
      const child = path ? path + '/' + item.name : item.name;
      if ((item as any).id || (item as any).metadata) {
        files.push(child);
      } else {
        files.push(...await collectStorageFiles(child));
      }
    }
    return files;
  }

  async function deleteAccount() {
    if (!supabase || !myUserId) return;

    try {
      const files = await collectStorageFiles(myUserId);
      for (let index = 0; index < files.length; index += 100) {
        const chunk = files.slice(index, index + 100);
        if (chunk.length) {
          const { error } = await supabase.storage.from('media').remove(chunk);
          if (error) console.warn('StreetClub account media cleanup:', error.message);
        }
      }

      const { error } = await supabase.rpc('delete_my_account');
      if (error) throw error;

      await signOut();
      router.replace('/auth');
    } catch (error: any) {
      Alert.alert(
        'Excluir conta',
        error?.message ?? 'Não foi possível excluir sua conta agora.'
      );
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir conta definitivamente?',
      'Seu perfil, garagem, posts, comentários, eventos, mensagens e demais dados vinculados à conta serão removidos. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: () => { void deleteAccount(); },
        },
      ]
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Configurações" subtitle="Conta e privacidade" />

        <SettingRow icon="person-outline" title="Editar perfil" onPress={() => router.push('/profile-edit')} />
        <SettingRow icon="shield-checkmark-outline" title="Privacidade e termos" onPress={() => router.push('/legal')} />
        <SettingRow icon="help-circle-outline" title="Ajuda e suporte" onPress={() => router.push('/support')} />

        <View style={styles.dangerSection}>
          <Text style={styles.dangerEyebrow}>CONTA</Text>
          <Pressable style={styles.deleteRow} onPress={confirmDelete}>
            <View style={styles.deleteIcon}><Ionicons name="trash-outline" size={19} color={theme.colors.danger} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deleteTitle}>Excluir minha conta</Text>
              <Text style={styles.deleteBody}>Remove permanentemente sua conta e os dados vinculados.</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={theme.colors.muted2} />
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function SettingRow({ icon, title, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.icon}><Ionicons name={icon} size={19} color={theme.colors.textSoft} /></View>
      <Text style={styles.title}>{title}</Text>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.muted2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  row: { minHeight: 64, marginHorizontal: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border, flexDirection: 'row', alignItems: 'center' },
  icon: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, color: theme.colors.text, fontSize: 12, fontWeight: '800', marginLeft: 11 },
  dangerSection: { margin: 16, marginTop: 26, borderTopWidth: 1, borderTopColor: '#451116', paddingTop: 15 },
  dangerEyebrow: { color: theme.colors.danger, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 6 },
  deleteRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center' },
  deleteIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#19080A', borderWidth: 1, borderColor: '#481116', alignItems: 'center', justifyContent: 'center' },
  deleteTitle: { color: theme.colors.danger, fontSize: 12.5, fontWeight: '900', marginLeft: 11 },
  deleteBody: { color: theme.colors.muted, fontSize: 9.5, lineHeight: 14, marginTop: 3, marginLeft: 11 },
});
