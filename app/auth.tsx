import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrandLogo } from '@/components/BrandLogo';
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
        router.replace('/(tabs)/feed');
      }
    });
  }, []);

  async function signIn() {
    if (!hasSupabaseConfig || !supabase) return Alert.alert('Serviço indisponível', 'Não foi possível acessar sua conta agora.');
    if (!email.trim() || !password) return Alert.alert('Entre na sua conta', 'Informe e-mail e senha.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      return Alert.alert('Não foi possível entrar', error.message);
    }
    await enterRealMode();
    setLoading(false);
    router.replace('/(tabs)/feed');
  }

  async function signUp() {
    if (!hasSupabaseConfig || !supabase) return Alert.alert('Serviço indisponível', 'Não foi possível criar sua conta agora.');
    if (!email.trim() || password.length < 6) return Alert.alert('Criar conta', 'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
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
    Alert.alert('Confira seu e-mail', 'Enviamos a confirmação da sua conta.');
  }

  function explore() {
    enterDemoMode();
    router.replace('/(tabs)/feed');
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <View style={styles.mark}>
              <Ionicons name="car-sport" size={42} color={theme.colors.accent} />
              <View style={styles.markLine} />
            </View>
            <BrandLogo size={37} />
            <Text style={styles.tagline}>MAIS QUE CARROS · UMA CULTURA</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Entre para a rua.</Text>
            <Text style={styles.sub}>Projetos reais, pessoas reais e encontros que começam aqui.</Text>

            <View style={styles.inputWrap}><Ionicons name="mail-outline" size={18} color={theme.colors.muted} /><TextInput placeholder="E-mail" placeholderTextColor={theme.colors.muted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} style={styles.input} /></View>
            <View style={styles.inputWrap}><Ionicons name="lock-closed-outline" size={18} color={theme.colors.muted} /><TextInput placeholder="Senha" placeholderTextColor={theme.colors.muted} secureTextEntry value={password} onChangeText={setPassword} style={styles.input} /></View>

            <Pressable onPress={() => router.push('/forgot-password')}><Text style={styles.forgot}>Esqueci minha senha</Text></Pressable>

            <Pressable style={styles.primary} onPress={() => { void signIn(); }} disabled={loading}><Text style={styles.primaryText}>{loading ? 'Entrando...' : 'Entrar'}</Text><Ionicons name="arrow-forward" size={18} color={theme.colors.white} /></Pressable>
            <Pressable style={styles.secondary} onPress={() => { void signUp(); }} disabled={loading}><Text style={styles.secondaryText}>Criar conta</Text></Pressable>

            <View style={styles.divider}><View style={styles.line} /><Text style={styles.or}>ou</Text><View style={styles.line} /></View>
            <Pressable style={styles.explore} onPress={explore}><Text style={styles.exploreText}>Explorar StreetClub</Text><Ionicons name="chevron-forward" size={17} color={theme.colors.muted} /></Pressable>
          </View>

          <Text style={styles.footer}>ENTRE PARA A CULTURA</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  brand: { alignItems: 'center', marginBottom: 30 },
  mark: { width: 104, height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  markLine: { width: 86, height: 2, backgroundColor: theme.colors.accent, transform: [{ skewX: '-28deg' }], marginTop: -7, opacity: .72 },
  tagline: { color: theme.colors.muted, fontWeight: '800', letterSpacing: 2.8, fontSize: 8.5, marginTop: 10 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl, padding: 18, borderWidth: 1, borderColor: theme.colors.border },
  heading: { color: theme.colors.text, fontSize: 24, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 6, marginBottom: 14, lineHeight: 18, fontSize: 11.5 },
  inputWrap: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.colors.surface2, borderRadius: theme.radius.md, paddingHorizontal: 13, marginTop: 9, borderWidth: 1, borderColor: theme.colors.border },
  input: { flex: 1, color: theme.colors.text, paddingVertical: 12, fontSize: 12.5 },
  forgot: { color: theme.colors.accent, fontWeight: '900', fontSize: 9.5, textAlign: 'right', marginTop: 9 },
  primary: { minHeight: 48, backgroundColor: theme.colors.accent, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, marginTop: 16 },
  primaryText: { color: theme.colors.white, fontWeight: '900', fontSize: 13 },
  secondary: { minHeight: 46, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  secondaryText: { color: theme.colors.text, fontWeight: '900', fontSize: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  or: { color: theme.colors.muted2, fontSize: 9.5 },
  explore: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  exploreText: { color: theme.colors.textSoft, fontWeight: '800', fontSize: 10.5 },
  footer: { color: theme.colors.muted2, textAlign: 'center', letterSpacing: 4.2, fontSize: 7.5, marginTop: 24 },
});
