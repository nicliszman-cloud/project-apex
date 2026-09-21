import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { BrandLogo } from '@/components/BrandLogo';
import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/lib/theme';

export function FeedEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mark}>
        <Ionicons name="car-sport-outline" size={34} color={theme.colors.accent} />
      </View>
      <BrandLogo size={29} />
      <Text style={styles.title}>A rua ainda está silenciosa.</Text>
      <Text style={styles.body}>Seja o primeiro a colocar seu projeto no StreetClub.</Text>
      <PrimaryButton onPress={onCreate} style={styles.button}>Publicar primeiro carro</PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    margin: 18,
    paddingHorizontal: 26,
    paddingVertical: 36,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: '#541016',
    backgroundColor: '#160709',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '900', marginTop: 22, textAlign: 'center' },
  body: { color: theme.colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 8, maxWidth: 290 },
  button: { width: '100%', marginTop: 24 },
});
