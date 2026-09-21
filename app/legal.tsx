import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { theme } from '@/lib/theme';

export default function LegalScreen() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.title}>Privacidade e termos</Text>
        </View>

        <Text style={styles.updated}>Rascunho operacional • v0.4</Text>

        <Text style={styles.section}>Privacidade</Text>
        <Text style={styles.body}>
          O APEX usa os dados necessários para operar sua conta e a comunidade: identificação de perfil, cidade/UF informadas por você, carros, fotos, publicações, eventos, anúncios, mensagens, curtidas, seguidores, bloqueios e denúncias.
        </Text>
        <Text style={styles.body}>
          Fotos e conteúdo publicados podem ser visíveis a outros usuários autenticados conforme a função utilizada. Mensagens diretas ficam disponíveis apenas aos participantes da conversa, sujeitas às regras de bloqueio e moderação.
        </Text>
        <Text style={styles.body}>
          Você pode editar seu perfil, bloquear usuários e excluir sua própria conta pelo aplicativo. A exclusão da conta remove os registros vinculados que usam exclusão em cascata no banco.
        </Text>

        <Text style={styles.section}>Regras da comunidade</Text>
        <Text style={styles.body}>
          O APEX é uma comunidade automotiva. Não publique conteúdo ilegal, ameaças, assédio, fraude, anúncios enganosos ou material que viole direitos de terceiros. Use as ferramentas de denúncia e bloqueio quando necessário.
        </Text>
        <Text style={styles.body}>
          Eventos e negociações são organizados por usuários. O aplicativo não garante condição de peças, pagamento, segurança de encontros presenciais ou veracidade de informações fornecidas por terceiros.
        </Text>

        <Text style={styles.section}>Marketplace</Text>
        <Text style={styles.body}>
          O Marketplace conecta pessoas interessadas em vender, trocar ou procurar peças. Pagamentos e entregas ainda não são processados pelo APEX. Confirme identidade, compatibilidade e condição do item antes de fechar uma negociação.
        </Text>

        <Text style={styles.notice}>
          Antes da publicação comercial, este texto deve ser revisado e convertido na Política de Privacidade e nos Termos oficiais da empresa, com responsável legal, canal de contato e URL pública.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 44 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { color: 'white', fontSize: 38, marginRight: 10, marginTop: -4 },
  title: { color: 'white', fontSize: 25, fontWeight: '900' },
  updated: { color: theme.colors.accent, fontWeight: '800', fontSize: 11, marginTop: 18 },
  section: { color: 'white', fontSize: 20, fontWeight: '900', marginTop: 24, marginBottom: 8 },
  body: { color: '#D6D9DE', lineHeight: 21, marginBottom: 11 },
  notice: { color: '#F5C451', backgroundColor: '#211B11', borderWidth: 1, borderColor: '#493A1D', borderRadius: 14, padding: 14, lineHeight: 19, marginTop: 24 },
});
