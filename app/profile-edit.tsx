import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
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
    if (!displayName.trim()) return Alert.alert('Nome obrigatório', 'Informe como você quer aparecer no APEX.');
    setSaving(true);
    try {
      await updateProfile({ displayName: displayName.trim(), username: username.trim(), city: city.trim(), state: state.trim().toUpperCase(), bio: bio.trim() });
      Alert.alert('Perfil salvo', isDemo ? 'Atualizado no modo demo.' : 'As informações foram salvas no Supabase.');
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
    Alert.alert('Excluir conta', 'Isso apagará sua conta e os dados vinculados. Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir definitivamente', style: 'destructive', onPress: async () => {
        const { error } = await supabase!.rpc('delete_my_account');
        if (error) return Alert.alert('Não foi possível excluir', error.message);
        await signOut();
        router.replace('/auth');
      }},
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>Seu perfil</Text></View>
        <Text style={styles.sub}>Essas informações aparecem na sua garagem, posts e carros.</Text>

        <Pressable style={styles.avatarWrap} onPress={chooseAvatar}>
          <AppImage uri={profile?.avatarUrl} style={styles.avatarImage} placeholder={<Text style={styles.avatarLetter}>{(profile?.displayName || 'A')[0].toUpperCase()}</Text>} />
          <Text style={styles.avatarAction}>{uploadingAvatar ? 'Enviando...' : 'Alterar foto'}</Text>
        </Pressable>

        <Text style={styles.label}>Nome</Text><TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} placeholder="Seu nome" placeholderTextColor={theme.colors.muted}/>
        <Text style={styles.label}>@username</Text><TextInput style={styles.input} value={username} onChangeText={(v) => setUsername(v.replace(/\s/g, '').toLowerCase())} autoCapitalize="none" placeholder="seuusuario" placeholderTextColor={theme.colors.muted}/>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.label}>Cidade</Text><TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="Cascavel" placeholderTextColor={theme.colors.muted}/></View><View style={{ width: 90 }}><Text style={styles.label}>UF</Text><TextInput style={styles.input} value={state} onChangeText={setState} maxLength={2} autoCapitalize="characters" placeholder="PR" placeholderTextColor={theme.colors.muted}/></View></View>
        <Text style={styles.label}>Bio</Text><TextInput style={[styles.input, styles.bio]} value={bio} onChangeText={setBio} multiline maxLength={240} placeholder="Conte um pouco sobre seu gosto por carros..." placeholderTextColor={theme.colors.muted}/>
        <Pressable style={styles.save} onPress={save} disabled={saving}><Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar perfil'}</Text></Pressable>
        <Pressable style={styles.legal} onPress={() => router.push('/legal')}><Text style={styles.legalText}>Privacidade, termos e regras</Text><Text style={styles.legalArrow}>›</Text></Pressable>
        <Pressable style={styles.logout} onPress={logout}><Text style={styles.logoutText}>{isDemo ? 'Sair do modo demo' : 'Sair da conta'}</Text></Pressable>
        {!isDemo && <Pressable style={styles.delete} onPress={deleteAccount}><Text style={styles.deleteText}>Excluir minha conta</Text></Pressable>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 50 },
  top: { flexDirection: 'row', alignItems: 'center' },
  back: { color: 'white', fontSize: 38, marginRight: 12, marginTop: -4 },
  title: { color: 'white', fontSize: 29, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 7, lineHeight: 20 },
  avatarWrap: { alignItems: 'center', marginTop: 24 },
  avatarImage: { width: 92, height: 92, borderRadius: 30 },
  avatarLetter: { color: 'white', fontWeight: '900', fontSize: 34 },
  avatarAction: { color: theme.colors.accent, fontWeight: '900', marginTop: 9 },
  label: { color: '#D8DADE', fontWeight: '800', fontSize: 12, marginTop: 18, marginBottom: 7 },
  input: { backgroundColor: theme.colors.surface, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 },
  row: { flexDirection: 'row', gap: 12 },
  bio: { minHeight: 110, textAlignVertical: 'top' },
  save: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 24 },
  saveText: { color: 'white', fontWeight: '900', fontSize: 15 },
  legal: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border, padding: 15, borderRadius: 15, marginTop: 12 },
  legalText: { color: '#D7DADE', fontWeight: '800' },
  legalArrow: { color: theme.colors.muted, fontSize: 24, marginLeft: 'auto' },
  logout: { borderWidth: 1, borderColor: theme.colors.border, padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 12 },
  logoutText: { color: '#D7DADE', fontWeight: '900' },
  delete: { borderWidth: 1, borderColor: '#68343A', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 12 },
  deleteText: { color: '#F07880', fontWeight: '900' },
});
