import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useApp } from '@/context/AppContext';
import { ACCOUNT_DELETION_URL, PRIVACY_CONTACT_URL, PRIVACY_POLICY_URL } from '@/lib/legal';
import { theme } from '@/lib/theme';

export default function AccountScreen() {
  const { deleteAccount, isDemo } = useApp();
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function open(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (!supported) return Alert.alert('StreetClub', 'Não foi possível abrir este endereço.');
    await Linking.openURL(url);
  }

  function requestDeletion() {
    if (isDemo) {
      return Alert.alert('Conta', 'Entre em uma conta para acessar as opções de exclusão.');
    }
    if (confirmation.trim().toUpperCase() !== 'EXCLUIR') {
      return Alert.alert('Confirmação', 'Digite EXCLUIR no campo antes de continuar.');
    }

    Alert.alert(
      'Excluir conta permanentemente?',
      'Seu perfil, garagem, posts, comentários, mensagens, eventos, anúncios, interações e mídias enviadas ao StreetClub serão excluídos. Essa ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir conta',
          style: 'destructive',
          onPress: () => {
            void performDeletion();
          },
        },
      ],
    );
  }

  async function performDeletion() {
    try {
      setDeleting(true);
      await deleteAccount();
      Alert.alert('Conta excluída', 'Sua conta e os dados associados foram excluídos do StreetClub.', [
        { text: 'OK', onPress: () => router.replace('/auth') },
      ]);
    } catch (error: any) {
      Alert.alert('Não foi possível excluir', error?.message ?? 'Tente novamente em alguns instantes.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Conta e privacidade" subtitle="Controle seus dados" />

        <View style={styles.card}>
          <View style={styles.icon}><Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.accent} /></View>
          <Text style={styles.title}>Privacidade</Text>
          <Text style={styles.body}>Consulte como o StreetClub utiliza dados de conta, perfil, mídia, mensagens, localização e interações.</Text>
          <Pressable style={styles.linkButton} onPress={() => { void open(PRIVACY_POLICY_URL); }}>
            <Text style={styles.linkText}>Política de Privacidade</Text>
            <Ionicons name="open-outline" size={17} color={theme.colors.textSoft} />
          </Pressable>
          <Pressable style={styles.linkButton} onPress={() => { void open(PRIVACY_CONTACT_URL); }}>
            <Text style={styles.linkText}>Contato de privacidade</Text>
            <Ionicons name="open-outline" size={17} color={theme.colors.textSoft} />
          </Pressable>
          <Pressable style={styles.linkButton} onPress={() => { void open(ACCOUNT_DELETION_URL); }}>
            <Text style={styles.linkText}>Exclusão pela Web</Text>
            <Ionicons name="open-outline" size={17} color={theme.colors.textSoft} />
          </Pressable>
        </View>

        <View style={styles.danger}>
          <View style={styles.dangerIcon}><Ionicons name="trash-outline" size={24} color={theme.colors.accent} /></View>
          <Text style={styles.dangerTitle}>Excluir minha conta</Text>
          <Text style={styles.body}>
            A exclusão é permanente. Os dados associados à sua conta e os arquivos enviados ao StreetClub serão removidos.
          </Text>
          <Text style={styles.confirmLabel}>Digite EXCLUIR para confirmar</Text>
          <TextInput
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="characters"
            placeholder="EXCLUIR"
            placeholderTextColor={theme.colors.muted2}
            style={styles.input}
          />
          <Pressable
            style={[styles.deleteButton, (deleting || confirmation.trim().toUpperCase() !== 'EXCLUIR') && styles.disabled]}
            onPress={requestDeletion}
            disabled={deleting || confirmation.trim().toUpperCase() !== 'EXCLUIR'}
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.white} />
            <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Excluir conta permanentemente'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 42 },
  card: { margin: 16, padding: 18, borderRadius: theme.radius.lg, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  icon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#170709', borderWidth: 1, borderColor: '#4E1116', alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
  body: { color: theme.colors.muted, fontSize: 11.5, lineHeight: 18, marginTop: 7 },
  linkButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 10, paddingTop: 10 },
  linkText: { flex: 1, color: theme.colors.textSoft, fontSize: 11.5, fontWeight: '800' },
  danger: { marginHorizontal: 16, marginBottom: 16, padding: 18, borderRadius: theme.radius.lg, backgroundColor: '#110708', borderWidth: 1, borderColor: '#4E1116' },
  dangerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1B080A', alignItems: 'center', justifyContent: 'center' },
  dangerTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
  confirmLabel: { color: theme.colors.textSoft, fontSize: 10.5, fontWeight: '800', marginTop: 16 },
  input: { minHeight: 48, marginTop: 8, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.borderStrong, backgroundColor: theme.colors.surface2, color: theme.colors.text, paddingHorizontal: 14, fontSize: 13, fontWeight: '900', letterSpacing: 1.2 },
  deleteButton: { minHeight: 50, marginTop: 12, borderRadius: theme.radius.md, backgroundColor: theme.colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { color: theme.colors.white, fontSize: 11.5, fontWeight: '900' },
  disabled: { opacity: .42 },
});
