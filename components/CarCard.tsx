import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppImage } from '@/components/AppImage';
import { Car } from '@/types';
import { theme } from '@/lib/theme';

export function CarCard({ car, onPress }: { car: Car; onPress?: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <AppImage uri={car.image} style={styles.image} placeholder={<Text style={styles.photoPlaceholder}>🏎️</Text>} />
      <View style={styles.overlay} />
      <View style={styles.topRow}>
        <AppImage
          uri={car.ownerAvatar.startsWith('http') ? car.ownerAvatar : null}
          style={styles.avatarImage}
          placeholder={<Text style={styles.avatarText}>{car.ownerAvatar.slice(0, 1)}</Text>}
        />
        <Text style={styles.owner}>{car.ownerName}</Text>
        <Text style={styles.location}>{car.city} • {car.state}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{car.make} {car.model}</Text>
        <Text style={styles.meta}>{car.year} • {car.currentHp} cv • {car.drivetrain}</Text>
        <View style={styles.tags}>{car.tags.slice(0, 3).map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: 560, borderRadius: 28, overflow: 'hidden', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  image: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  photoPlaceholder: { fontSize: 52 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.18)' },
  topRow: { position: 'absolute', left: 18, right: 18, top: 18, flexDirection: 'row', alignItems: 'center' },
  avatarImage: { width: 34, height: 34, borderRadius: 17 },
  avatarText: { color: 'white', fontWeight: '900' },
  owner: { color: 'white', fontWeight: '800', marginLeft: 9 },
  location: { marginLeft: 'auto', color: 'white', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  info: { position: 'absolute', left: 20, right: 20, bottom: 22 },
  title: { color: 'white', fontSize: 31, fontWeight: '900', letterSpacing: -0.8 },
  meta: { color: '#E8E9EB', marginTop: 5, fontSize: 15, fontWeight: '700' },
  tags: { flexDirection: 'row', gap: 7, marginTop: 13 },
  tag: { color: 'white', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, fontSize: 12, fontWeight: '700' },
});
