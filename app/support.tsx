import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PRIVACY_CONTACT_URL } from '@/lib/legal';
import { theme } from '@/lib/theme';

export default function SupportScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Ajuda e suporte" subtitle="Central StreetClub" />

        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="help-buoy-outline" size={28} color={theme.colors.accent} /></View>
          <Text style={styles.heroTitle}>Como podemos ajudar?</Text>
          <Text style={styles.heroText}>Encontre atalhos para conta, segurança, anúncios e comunidade.</Text>
        </View>

        <SupportRow icon="key-outline" title="Acesso à conta" body="Redefina sua senha pela tela de entrada caso perca o acesso." onPress={() => router.push('/forgot-password')} />
        <SupportRow icon="shield-checkmark-outline" title="Segurança e denúncias" body="Use Bloquear ou Denunciar no perfil e nas publicações para sinalizar problemas." />
        <SupportRow icon="construct-outline" title="Marketplace" body="Confira compatibilidade, condição da peça e detalhes da negociação antes de fechar negócio." onPress={() => router.push('/(tabs)/marketplace')} />
        <SupportRow icon="calendar-outline" title="Eventos" body="Organizadores e participantes devem seguir as regras do local e a legislação aplicável." onPress={() => router.push('/(tabs)/meets')} />
        <SupportRow icon="document-text-outline" title="Privacidade e termos" body="Consulte como os dados e as regras da comunidade são tratados." onPress={() => router.push('/legal')} />
        <SupportRow icon="mail-outline" title="Contato de privacidade" body="Envie dúvidas ou solicitações relacionadas aos seus dados." onPress={() => { void Linking.openURL(PRIVACY_CONTACT_URL); }} />
      </ScrollView>
    </Screen>
  );
}

function SupportRow({ icon, title, body, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string; onPress?: () => void }) {
  const Component = onPress ? Pressable : View;
  return (
    <Component style={styles.row} {...(onPress ? { onPress } : {})}>
      <View style={styles.icon}><Ionicons name={icon} size={20} color={theme.colors.accent} /></View>
      <View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.body}>{body}</Text></View>
      {!!onPress && <Ionicons name="chevron-forward" size={17} color={theme.colors.muted2} />}
    </Component>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 38 },
  hero: { marginHorizontal: 16, marginTop: 12, marginBottom: 10, padding: 22, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center' },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#170709', borderWidth: 1, borderColor: '#4E1116', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
  heroText: { color: theme.colors.muted, fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  row: { marginHorizontal: 16, minHeight: 78, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 11, paddingVertical: 10 },
  title: { color: theme.colors.text, fontSize: 12.5, fontWeight: '900' },
  body: { color: theme.colors.muted, fontSize: 10.5, lineHeight: 15, marginTop: 4 },
});
