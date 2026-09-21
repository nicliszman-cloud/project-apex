import { Dimensions, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

const WIDTH = Dimensions.get('window').width;

export default function CarProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cars } = useApp();
  const car = cars.find((item) => item.id === id) ?? cars[0];

  if (!car) return <Screen><View style={styles.missing}><Text style={styles.empty}>Carro não encontrado.</Text></View></Screen>;

  const gallery = car.images?.length ? car.images : [car.image];

  return (
    <Screen>
      <ScrollView>
        <View>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {gallery.map((image, index) => <Image key={image + index} source={{ uri: image }} style={styles.hero} />)}
          </ScrollView>
          <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>‹</Text></Pressable>
          {gallery.length > 1 && <View style={styles.photoCount}><Text style={styles.photoCountText}>{gallery.length} fotos</Text></View>}
        </View>

        <View style={styles.body}>
          <Text style={styles.kicker}>{car.category} • {car.city}, {car.state}</Text>
          <Text style={styles.title}>{car.make} {car.model}</Text>
          <Text style={styles.owner}>por {car.ownerName}</Text>

          <View style={styles.metrics}>
            <View><Text style={styles.number}>{car.currentHp}</Text><Text style={styles.label}>CV ATUAL</Text></View>
            <View><Text style={styles.number}>{car.year}</Text><Text style={styles.label}>ANO</Text></View>
            <View><Text style={styles.number}>{car.drivetrain}</Text><Text style={styles.label}>TRAÇÃO</Text></View>
          </View>

          <Text style={styles.section}>Ficha</Text>
          <View style={styles.spec}><Text style={styles.specLabel}>Motor</Text><Text style={styles.specValue}>{car.engine}</Text></View>
          <View style={styles.spec}><Text style={styles.specLabel}>Câmbio</Text><Text style={styles.specValue}>{car.transmission}</Text></View>
          <View style={styles.spec}><Text style={styles.specLabel}>Potência original</Text><Text style={styles.specValue}>{car.stockHp} cv</Text></View>
          <View style={styles.spec}><Text style={styles.specLabel}>Potência atual</Text><Text style={styles.specValue}>{car.currentHp} cv</Text></View>

          <Text style={styles.section}>Build</Text>
          {car.modifications.length ? car.modifications.map((m) => <View key={m} style={styles.mod}><Text style={styles.dot}>•</Text><Text style={styles.modText}>{m}</Text></View>) : <Text style={styles.empty}>Nenhuma modificação cadastrada ainda.</Text>}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: WIDTH, height: 330 },
  back: { position: 'absolute', top: 14, left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' },
  backText: { color: 'white', fontSize: 38, marginTop: -4 },
  photoCount: { position: 'absolute', right: 14, bottom: 14, backgroundColor: 'rgba(0,0,0,.65)', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7 },
  photoCountText: { color: 'white', fontWeight: '800', fontSize: 11 },
  body: { padding: 20 },
  kicker: { color: theme.colors.accent, fontWeight: '900', letterSpacing: 1.3, fontSize: 11 },
  title: { color: 'white', fontSize: 31, fontWeight: '900', marginTop: 5 },
  owner: { color: theme.colors.muted, marginTop: 5 },
  metrics: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 18, paddingVertical: 17, marginTop: 20 },
  number: { color: 'white', fontWeight: '900', fontSize: 19, textAlign: 'center' },
  label: { color: theme.colors.muted, fontWeight: '800', fontSize: 9, marginTop: 3 },
  section: { color: 'white', fontSize: 19, fontWeight: '900', marginTop: 25, marginBottom: 8 },
  spec: { flexDirection: 'row', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  specLabel: { color: theme.colors.muted },
  specValue: { color: 'white', marginLeft: 'auto', fontWeight: '800', maxWidth: '58%', textAlign: 'right' },
  mod: { flexDirection: 'row', paddingVertical: 6 },
  dot: { color: theme.colors.accent, fontSize: 22, marginRight: 9 },
  modText: { color: '#E2E4E7', marginTop: 4 },
  empty: { color: theme.colors.muted },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
