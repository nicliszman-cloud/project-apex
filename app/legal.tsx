import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { theme } from '@/lib/theme';

export default function LegalScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Privacidade e termos" subtitle="StreetClub" />

        <LegalSection
          icon="shield-checkmark-outline"
          title="Privacidade"
          body="O StreetClub utiliza os dados necessários para manter sua conta, perfil, garagem, publicações, eventos, anúncios, mensagens, interações e recursos de segurança. Conteúdos publicados em áreas sociais podem ser vistos por outros usuários conforme a função utilizada."
        />
        <LegalSection
          icon="chatbubbles-outline"
          title="Mensagens"
          body="Mensagens diretas ficam disponíveis aos participantes da conversa. Bloqueios impedem novas interações entre as contas envolvidas."
        />
        <LegalSection
          icon="people-outline"
          title="Comunidade"
          body="Não use o StreetClub para assédio, ameaças, fraude, spam, conteúdo ilegal, anúncios enganosos ou violação de direitos de terceiros. Use as ferramentas de bloqueio e denúncia quando necessário."
        />
        <LegalSection
          icon="construct-outline"
          title="Marketplace"
          body="O Marketplace aproxima usuários interessados em vender, trocar ou procurar peças. Confirme condição, procedência, compatibilidade e detalhes da negociação antes de fechar negócio."
        />
        <LegalSection
          icon="calendar-outline"
          title="Eventos"
          body="Encontros e eventos são organizados por usuários. Organizadores e participantes são responsáveis por cumprir regras do local, legislação e práticas de segurança."
        />
        <LegalSection
          icon="person-circle-outline"
          title="Sua conta"
          body="Você pode editar seus dados, bloquear outros usuários e excluir sua própria conta pelo aplicativo."
        />

        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={18} color={theme.colors.muted} />
          <Text style={styles.footerText}>Ao usar o StreetClub, você concorda em respeitar estas regras e as políticas aplicáveis ao serviço.</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

function LegalSection({ icon, title, body }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.icon}><Ionicons name={icon} size={20} color={theme.colors.accent} /></View>
      <View style={styles.copy}><Text style={styles.title}>{title}</Text><Text style={styles.body}>{body}</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },
  section: { marginHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  icon: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#170709', borderWidth: 1, borderColor: '#4E1116', alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, marginLeft: 12 },
  title: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
  body: { color: theme.colors.muted, fontSize: 11, lineHeight: 17, marginTop: 5 },
  footer: { margin: 16, padding: 14, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  footerText: { color: theme.colors.textSoft, flex: 1, fontSize: 10.5, lineHeight: 16 },
});
