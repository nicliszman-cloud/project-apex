import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!supabase) return;
    if (!email.trim()) return Alert.alert('Informe seu e-mail');
    setSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'projectapex://reset-password',
    });
    setSending(false);
    if (error) return Alert.alert('Não foi possível enviar', error.message);
    setSent(true);
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <ScreenHeader title="Recuperar senha" subtitle="Volte para sua garagem" />
        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name={sent ? 'mail-open-outline' : 'key-outline'} size={27} color={theme.colors.accent} /></View>
          <Text style={styles.title}>{sent ? 'Confira seu e-mail' : 'Vamos recuperar seu acesso.'}</Text>
          <Text style={styles.body}>
            {sent ? 'Enviamos um link para você definir uma nova senha e voltar ao StreetClub.' : 'Digite o e-mail da sua conta StreetClub para receber o link de recuperação.'}
          </Text>
          {!sent && <FormField label="E-mail" placeholder="seu@email.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />}
          {!sent && <PrimaryButton onPress={() => { void send(); }} disabled={sending} style={styles.button}>{sending ? 'Enviando...' : 'Enviar link'}</PrimaryButton>}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  card: { margin: 16, padding: 20, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#170709', borderWidth: 1, borderColor: '#4E1116', alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '900', marginTop: 16 },
  body: { color: theme.colors.muted, fontSize: 11.5, lineHeight: 18, marginTop: 7 },
  button: { marginTop: 20 },
});
