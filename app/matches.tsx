import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppImage } from '@/components/AppImage';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { openConversation } from '@/lib/messaging';
import { theme } from '@/lib/theme';

export default function MatchesScreen() {
  const { matches, isDemo } = useApp();

  async function message(partnerId: string) {
    if (isDemo) return router.push('/chat');
    try {
      const conversationId = await openConversation(partnerId);
      router.push({ pathname: '/chat', params: { conversationId } });
    } catch (error: any) {
      Alert.alert('Mensagem', error?.message ?? 'Não foi possível abrir a conversa.');
    }
  }

  return (
    <Screen>
      <ScreenHeader title="Garage Matches" subtitle="Projetos que curtiram você de volta" />
      {matches.length === 0 ? (
        <EmptyState icon="flame-outline" title="Nenhum match ainda" body="Explore projetos e curta os carros que fazem seu estilo." action="Explorar projetos" onAction={() => router.replace('/(tabs)/discover')} />
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable style={styles.match} onPress={() => { void message(item.partnerId); }}>
              <AppImage uri={item.partnerCarImage} style={styles.image} placeholder={<Ionicons name="car-sport-outline" size={27} color={theme.colors.muted2} />} />
              <View style={styles.info}>
                <View style={styles.matchLabel}><Ionicons name="flame" size={13} color={theme.colors.accent} /><Text style={styles.matchText}>MATCH</Text></View>
                <Text style={styles.name}>{item.partnerName}</Text>
                <Text style={styles.car}>{item.partnerCarName}</Text>
                <Text style={styles.hint}>Toque para conversar</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.muted2} />
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, gap: 10, paddingBottom: 30 },
  match: { minHeight: 98, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: 10 },
  image: { width: 78, height: 78, borderRadius: 13 },
  info: { flex: 1, marginLeft: 11 },
  matchLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  matchText: { color: theme.colors.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  name: { color: theme.colors.text, fontSize: 14.5, fontWeight: '900', marginTop: 4 },
  car: { color: theme.colors.textSoft, marginTop: 2, fontSize: 10.5, fontWeight: '700' },
  hint: { color: theme.colors.muted, fontSize: 9, marginTop: 5 },
});
