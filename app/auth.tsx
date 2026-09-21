import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { BrandLogo } from '@/components/BrandLogo';
import { useApp } from '@/context/AppContext';
import { hasSupabaseConfig, supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

const AUTH_BACKGROUND =
  'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1600&q=88';

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
    if (!hasSupabaseConfig || !supabase) {
      return Alert.alert('Serviço indisponível', 'Não foi possível acessar sua conta agora.');
    }
    if (!email.trim() || !password) {
      return Alert.alert('Entre na sua conta', 'Informe e-mail e senha.');
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoading(false);
      return Alert.alert('Não foi possível entrar', error.message);
    }

    await enterRealMode();
    setLoading(false);
    router.replace('/(tabs)/feed');
  }

  async function signUp() {
    if (!hasSupabaseConfig || !supabase) {
      return Alert.alert('Serviço indisponível', 'Não foi possível criar sua conta agora.');
    }
    if (!email.trim() || password.length < 6) {
      return Alert.alert(
        'Criar conta',
        'Informe um e-mail válido e uma senha com pelo menos 6 caracteres.'
      );
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

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
    <Screen style={styles.screen}>
      <AppImage uri={AUTH_BACKGROUND} style={StyleSheet.absoluteFill} contentFit="cover" />
      <View pointerEvents="none" style={styles.backgroundShade} />
      <View pointerEvents="none" style={styles.redGlowTop} />
      <View pointerEvents="none" style={styles.redGlowBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.wrap}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroMark}>
              <Text style={styles.heroS}>S</Text>
              <Ionicons
                name="car-sport"
                size={44}
                color={theme.colors.accent}
                style={styles.heroCar}
              />
              <View style={styles.heroLine} />
            </View>

            <BrandLogo size={43} />
            <Text style={styles.tagline}>MAIS QUE CARROS · UMA CULTURA</Text>
          </View>

          <View style={styles.card}>
            <View pointerEvents="none" style={styles.cardGlow} />

            <Text style={styles.heading}>Entre para a rua.</Text>
            <Text style={styles.sub}>
              Projetos reais, pessoas reais e encontros que começam aqui.
            </Text>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={21} color={theme.colors.muted} />
              <TextInput
                placeholder="E-mail"
                placeholderTextColor={theme.colors.muted}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={21} color={theme.colors.muted} />
              <TextInput
                placeholder="Senha"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
            </View>

            <Pressable onPress={() => router.push('/forgot-password')}>
              <Text style={styles.forgot}>Esqueci minha senha</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
              onPress={() => {
                void signIn();
              }}
              disabled={loading}
            >
              <Text style={styles.primaryText}>{loading ? 'Entrando...' : 'Entrar'}</Text>
              <Ionicons name="arrow-forward" size={22} color={theme.colors.white} />
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
              onPress={() => {
                void signUp();
              }}
              disabled={loading}
            >
              <Text style={styles.secondaryText}>Criar conta</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.or}>ou</Text>
              <View style={styles.line} />
            </View>

            <Pressable style={styles.explore} onPress={explore}>
              <Text style={styles.exploreText}>Explorar StreetClub</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.muted} />
            </Pressable>
          </View>

          <Text style={styles.footer}>ENTRE PARA A CULTURA</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#030304' },
  flex: { flex: 1 },
  wrap: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 34,
  },

  backgroundShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,.56)',
  },
  redGlowTop: {
    position: 'absolute',
    top: 8,
    right: -90,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(229,9,20,.16)',
  },
  redGlowBottom: {
    position: 'absolute',
    bottom: -120,
    left: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(229,9,20,.12)',
  },

  hero: {
    minHeight: 315,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 26,
  },
  heroMark: {
    width: 250,
    height: 155,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -10,
  },
  heroS: {
    position: 'absolute',
    color: 'rgba(229,9,20,.18)',
    fontSize: 180,
    lineHeight: 180,
    fontWeight: '900',
    fontStyle: 'italic',
    transform: [{ skewX: '-10deg' }],
    textShadowColor: '#E50914',
    textShadowRadius: 16,
  },
  heroCar: {
    marginTop: 14,
    textShadowColor: '#E50914',
    textShadowRadius: 12,
  },
  heroLine: {
    width: 122,
    height: 2,
    backgroundColor: theme.colors.accent,
    marginTop: -6,
    transform: [{ skewX: '-28deg' }],
    shadowColor: theme.colors.accent,
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 6,
  },
  tagline: {
    color: '#B9BBC1',
    fontWeight: '900',
    letterSpacing: 3.8,
    fontSize: 9,
    marginTop: 14,
  },

  card: {
    overflow: 'hidden',
    backgroundColor: 'rgba(13,8,9,.90)',
    borderRadius: 27,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(229,9,20,.86)',
    shadowColor: '#E50914',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  cardGlow: {
    position: 'absolute',
    right: -95,
    top: -90,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(229,9,20,.12)',
  },
  heading: {
    color: theme.colors.white,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  sub: {
    color: '#B1B3B8',
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 21,
    fontSize: 13,
  },

  inputWrap: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    backgroundColor: 'rgba(20,21,25,.90)',
    borderRadius: 18,
    paddingHorizontal: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#34363D',
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    paddingVertical: 15,
    fontSize: 14,
  },
  forgot: {
    color: '#FF313B',
    fontWeight: '900',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 12,
  },

  primary: {
    minHeight: 57,
    backgroundColor: '#EB1E28',
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    shadowColor: '#E50914',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryPressed: { backgroundColor: theme.colors.accentPressed, transform: [{ scale: 0.995 }] },
  primaryText: {
    color: theme.colors.white,
    fontWeight: '900',
    fontSize: 15,
  },

  secondary: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#55575E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(5,5,6,.42)',
  },
  secondaryPressed: { backgroundColor: 'rgba(255,255,255,.05)' },
  secondaryText: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 14,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginVertical: 18,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#3A3C42',
  },
  or: {
    color: theme.colors.muted2,
    fontSize: 11,
  },
  explore: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exploreText: {
    color: theme.colors.textSoft,
    fontWeight: '900',
    fontSize: 12,
  },
  footer: {
    color: '#8C8F97',
    textAlign: 'center',
    letterSpacing: 5.4,
    fontSize: 8,
    marginTop: 24,
  },
});
