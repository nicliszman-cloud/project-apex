import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
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
    Alert.alert('Senha atualizada', 'Sua nova senha já está pronta para uso.');
    router.replace('/auth');
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="lock-closed-outline" size={28} color={theme.colors.accent} /></View>
          <Text style={styles.title}>Crie uma nova senha</Text>
          <Text style={styles.body}>{ready ? 'Escolha uma senha segura para sua conta StreetClub.' : 'Validando seu link de recuperação...'}</Text>
          <FormField label="Nova senha" placeholder="Mínimo de 8 caracteres" secureTextEntry value={password} onChangeText={setPassword} editable={ready} />
          <PrimaryButton onPress={() => { void save(); }} disabled={saving || !ready} style={styles.button}>{saving ? 'Salvando...' : 'Atualizar senha'}</PrimaryButton>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { padding: 22, borderRadius: theme.radius.xl, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  icon: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#170709', borderWidth: 1, borderColor: '#4E1116', alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '900', marginTop: 16 },
  body: { color: theme.colors.muted, fontSize: 11.5, lineHeight: 18, marginTop: 7 },
  button: { marginTop: 20 },
});
