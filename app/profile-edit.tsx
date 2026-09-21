import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppImage } from '@/components/AppImage';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { pickImages } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function ProfileEditScreen() {
  const { profile, updateProfile, updateAvatar, signOut, isDemo } = useApp();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    setDisplayName(profile?.displayName ?? '');
    setUsername(profile?.username ?? '');
    setCity(profile?.city ?? '');
    setState(profile?.state ?? '');
    setBio(profile?.bio ?? '');
  }, [profile]);

  async function chooseAvatar() {
    try {
      const selected = await pickImages(false);
      if (!selected[0]) return;
      setUploadingAvatar(true);
      await updateAvatar(selected[0]);
    } catch (error: any) {
      Alert.alert('Foto de perfil', error?.message ?? 'Não foi possível enviar a foto.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function save() {
    if (!displayName.trim()) return Alert.alert('Nome obrigatório', 'Informe como você quer aparecer no StreetClub.');
    setSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        bio: bio.trim(),
      });
      router.replace('/(tabs)/garage');
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await signOut();
    router.replace('/auth');
  }

  function deleteAccount() {
    if (isDemo || !supabase) return;
    Alert.alert('Excluir conta', 'Sua conta e os dados vinculados serão removidos. Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir definitivamente',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase!.rpc('delete_my_account');
          if (error) return Alert.alert('Não foi possível excluir', error.message);
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Editar perfil" subtitle="Sua identidade no StreetClub" />

        <Pressable style={styles.avatarWrap} onPress={() => { void chooseAvatar(); }}>
          <AppImage
            uri={profile?.avatarUrl}
            style={styles.avatar}
            placeholder={<Text style={styles.avatarLetter}>{(profile?.displayName || 'S')[0].toUpperCase()}</Text>}
          />
          <View style={styles.camera}>
            {uploadingAvatar ? <Ionicons name="hourglass-outline" size={16} color={theme.colors.white} /> : <Ionicons name="camera" size={16} color={theme.colors.white} />}
          </View>
          <Text style={styles.avatarAction}>{uploadingAvatar ? 'Enviando foto...' : 'Alterar foto'}</Text>
        </Pressable>

        <View style={styles.form}>
          <FormField label="Nome" value={displayName} onChangeText={setDisplayName} placeholder="Seu nome" />
          <FormField label="@username" value={username} onChangeText={(value) => setUsername(value.replace(/\s/g, '').toLowerCase())} autoCapitalize="none" placeholder="seuusuario" />
          <View style={styles.row}>
            <FormField containerStyle={styles.flex} label="Cidade" value={city} onChangeText={setCity} placeholder="Cascavel" />
            <FormField containerStyle={styles.state} label="UF" value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" placeholder="PR" />
          </View>
          <FormField label="Bio" value={bio} onChangeText={setBio} multiline maxLength={240} placeholder="Conte sobre você, sua garagem e sua paixão por carros." />
          <Text style={styles.counter}>{bio.length}/240</Text>
        </View>

        <PrimaryButton onPress={() => { void save(); }} disabled={saving} style={styles.save}>{saving ? 'Salvando...' : 'Salvar alterações'}</PrimaryButton>

        <View style={styles.settings}>
          <SettingRow icon="shield-checkmark-outline" text="Privacidade, termos e regras" onPress={() => router.push('/legal')} />
          <SettingRow icon="help-circle-outline" text="Ajuda e suporte" onPress={() => router.push('/support')} />
          <SettingRow icon="log-out-outline" text={isDemo ? 'Voltar para entrada' : 'Sair da conta'} onPress={() => { void logout(); }} />
        </View>

        {!isDemo && (
          <Pressable style={styles.delete} onPress={deleteAccount}>
            <Ionicons name="trash-outline" size={17} color={theme.colors.danger} />
            <Text style={styles.deleteText}>Excluir minha conta</Text>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}

function SettingRow({ icon, text, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string; onPress: () => void }) {
  return (
    <Pressable style={styles.settingRow} onPress={onPress}>
      <Ionicons name={icon} size={19} color={theme.colors.textSoft} />
      <Text style={styles.settingText}>{text}</Text>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.muted2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 42 },
  avatarWrap: { alignItems: 'center', marginTop: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: theme.colors.borderStrong },
  avatarLetter: { color: theme.colors.text, fontWeight: '900', fontSize: 31 },
  camera: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.accent, borderWidth: 3, borderColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', marginTop: -25, marginLeft: 68 },
  avatarAction: { color: theme.colors.accent, fontSize: 10.5, fontWeight: '900', marginTop: 8 },
  form: { paddingHorizontal: 16, marginTop: 2 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  state: { width: 82 },
  counter: { color: theme.colors.muted2, fontSize: 8.5, textAlign: 'right', marginTop: 5 },
  save: { marginHorizontal: 16, marginTop: 22 },
  settings: { marginHorizontal: 16, marginTop: 22, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: theme.colors.surface },
  settingRow: { minHeight: 52, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  settingText: { color: theme.colors.textSoft, flex: 1, fontSize: 11.5, fontWeight: '800' },
  delete: { minHeight: 48, marginHorizontal: 16, marginTop: 12, borderRadius: theme.radius.md, borderWidth: 1, borderColor: '#572026', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  deleteText: { color: theme.colors.danger, fontWeight: '900', fontSize: 11 },
});
