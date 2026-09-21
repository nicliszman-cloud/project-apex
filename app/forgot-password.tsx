import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    if (!supabase) return;
    if (!email.trim()) return Alert.alert('Informe seu e-mail');
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'projectapex://reset-password',
    });
    setSending(false);
    if (error) return Alert.alert('Não foi possível enviar', error.message);
    Alert.alert('E-mail enviado', 'Abra o link de recuperação no celular para definir uma nova senha.');
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.sub}>Digite o e-mail da sua conta APEX.</Text>
        <TextInput style={styles.input} placeholder="seu@email.com" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Pressable style={styles.button} onPress={send} disabled={sending}><Text style={styles.buttonText}>{sending ? 'Enviando...' : 'Enviar link'}</Text></Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 22 },
  back: { color: 'white', fontSize: 38 },
  title: { color: 'white', fontSize: 29, fontWeight: '900', marginTop: 20 },
  sub: { color: theme.colors.muted, marginTop: 7, marginBottom: 18 },
  input: { backgroundColor: theme.colors.surface, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 },
  button: { backgroundColor: theme.colors.accent, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 15 },
  buttonText: { color: 'white', fontWeight: '900' },
});
