import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function ResetPasswordScreen() {
  const url = Linking.useURL();
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function recover() {
      if (!supabase) return;
      if (!url) {
        setReady(true);
        return;
      }
      const parsed = Linking.parse(url);
      const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : null;
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) Alert.alert('Link de recuperação', error.message);
      }
      setReady(true);
    }
    void recover();
  }, [url]);

  async function save() {
    if (!supabase) return;
    if (password.length < 8) return Alert.alert('Senha muito curta', 'Use pelo menos 8 caracteres.');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return Alert.alert('Não foi possível alterar', error.message);
    Alert.alert('Senha atualizada');
    router.replace('/auth');
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <Text style={styles.title}>Nova senha</Text>
        <Text style={styles.sub}>{ready ? 'Defina uma nova senha para sua conta.' : 'Validando link de recuperação...'}</Text>
        <TextInput style={styles.input} placeholder="Nova senha" placeholderTextColor={theme.colors.muted} secureTextEntry value={password} onChangeText={setPassword} editable={ready} />
        <Pressable style={styles.button} onPress={save} disabled={saving || !ready}><Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Atualizar senha'}</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 22, justifyContent: 'center' },
  title: { color: 'white', fontSize: 29, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 7, marginBottom: 18 },
  input: { backgroundColor: theme.colors.surface, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 },
  button: { backgroundColor: theme.colors.accent, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 15 },
  buttonText: { color: 'white', fontWeight: '900' },
});
