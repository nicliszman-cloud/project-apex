import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function AuthScreen() {
  const { enterDemoMode, enterRealMode } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) {
        await enterRealMode();
        router.replace('/(tabs)/discover');
      }
    });
  }, []);

  async function signIn() {
    if (!hasSupabaseConfig || !supabase) {
      Alert.alert('Modo demo', 'O Supabase ainda não está configurado. Use “Entrar no modo demo”.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return Alert.alert('Não foi possível entrar', error.message);
    }
    await enterRealMode();
    setLoading(false);
    router.replace('/(tabs)/discover');
  }

  async function signUp() {
    if (!hasSupabaseConfig || !supabase) {
      Alert.alert('Supabase não configurado', 'Copie .env.example para .env e informe as chaves do seu projeto.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      return Alert.alert('Não foi possível cadastrar', error.message);
    }
    if (data.session) {
      await enterRealMode();
      setLoading(false);
      router.replace('/profile-edit');
      return;
    }
    setLoading(false);
    Alert.alert('Cadastro criado', 'Confira seu e-mail para confirmar a conta e depois faça login.');
  }

  function demo() {
    enterDemoMode();
    router.replace('/(tabs)/discover');
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>A</Text></View><Text style={styles.name}>APEX</Text><Text style={styles.tagline}>DISCOVER • BUILD • MEET</Text></View>
        <View style={styles.card}>
          <Text style={styles.heading}>Sua garagem começa aqui.</Text><Text style={styles.sub}>Entre para descobrir projetos, carros e encontros.</Text>
          <TextInput placeholder="E-mail" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input}/>
          <TextInput placeholder="Senha" placeholderTextColor={theme.colors.muted} secureTextEntry value={password} onChangeText={setPassword} style={styles.input}/>
          <Pressable style={styles.primary} onPress={signIn} disabled={loading}><Text style={styles.primaryText}>{loading ? 'Entrando...' : 'Entrar'}</Text></Pressable>
          <Pressable style={styles.secondary} onPress={signUp}><Text style={styles.secondaryText}>Criar conta</Text></Pressable>
          <View style={styles.divider}><View style={styles.line}/><Text style={styles.or}>ou</Text><View style={styles.line}/></View>
          <Pressable style={styles.demo} onPress={demo}><Text style={styles.demoText}>Entrar no modo demo</Text></Pressable>
          <Text style={styles.note}>{hasSupabaseConfig ? 'Supabase conectado' : 'Demo pronta • Supabase opcional para testar'}</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center' }, brand: { alignItems: 'center', marginBottom: 34 }, logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] }, logoText: { color: 'white', fontSize: 38, fontWeight: '900', transform: [{ rotate: '8deg' }] }, name: { color: 'white', fontSize: 34, fontWeight: '900', letterSpacing: 6, marginTop: 18 }, tagline: { color: theme.colors.muted, fontWeight: '800', letterSpacing: 2, fontSize: 11, marginTop: 7 }, card: { backgroundColor: theme.colors.surface, borderRadius: 26, padding: 20, borderWidth: 1, borderColor: theme.colors.border }, heading: { color: 'white', fontSize: 25, fontWeight: '900' }, sub: { color: theme.colors.muted, marginTop: 6, marginBottom: 18, lineHeight: 20 }, input: { backgroundColor: theme.colors.surface2, color: 'white', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, marginTop: 10, borderWidth: 1, borderColor: theme.colors.border }, primary: { backgroundColor: theme.colors.accent, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 16 }, primaryText: { color: 'white', fontWeight: '900', fontSize: 16 }, secondary: { padding: 14, alignItems: 'center' }, secondaryText: { color: 'white', fontWeight: '800' }, divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 6 }, line: { flex: 1, height: 1, backgroundColor: theme.colors.border }, or: { color: theme.colors.muted, fontSize: 12 }, demo: { borderWidth: 1, borderColor: theme.colors.border, padding: 14, borderRadius: 14, alignItems: 'center' }, demoText: { color: '#D7DAE0', fontWeight: '800' }, note: { color: theme.colors.muted, textAlign: 'center', fontSize: 11, marginTop: 12 },
});
