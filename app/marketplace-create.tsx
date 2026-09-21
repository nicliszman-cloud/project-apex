import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { AppImage } from '@/components/AppImage';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useApp } from '@/context/AppContext';
import { LocalImage, pickImages, uploadPublicImage } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Kind = 'sell' | 'trade' | 'wanted';
const categories = ['Motor', 'Turbo', 'Suspensão', 'Rodas', 'Freios', 'Exterior', 'Interior'];

export default function MarketplaceCreateScreen() {
  const { myUserId, profile, cars } = useApp();
  const [kind, setKind] = useState<Kind>('sell');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [compatibility, setCompatibility] = useState('');
  const [price, setPrice] = useState('');
  const [carId, setCarId] = useState<string | null>(null);
  const [image, setImage] = useState<LocalImage | null>(null);
  const [saving, setSaving] = useState(false);
  const myCars = useMemo(() => cars.filter((car) => car.ownerId === myUserId), [cars, myUserId]);

  async function chooseImage() {
    try {
      const selected = await pickImages(false);
      if (selected[0]) setImage(selected[0]);
    } catch (error: any) {
      Alert.alert('Foto', error?.message ?? 'Não foi possível abrir a galeria.');
    }
  }

  async function save() {
    if (!supabase || !myUserId) return;
    if (!title.trim()) return Alert.alert('Título obrigatório', 'Informe o que está anunciando.');
    setSaving(true);
    try {
      const imageUrl = image ? await uploadPublicImage(myUserId, image, 'marketplace') : null;
      const normalized = price.replace(/[^0-9,\.]/g, '').replace('.', '').replace(',', '.');
      const cents = kind === 'sell' && normalized ? Math.round(Number(normalized) * 100) : null;
      const { error } = await supabase.from('marketplace_listings').insert({
        seller_id: myUserId,
        car_id: carId,
        kind,
        title: title.trim(),
        description: description.trim() || null,
        price_cents: Number.isFinite(cents as number) ? cents : null,
        part_category: category.trim() || null,
        compatibility: compatibility.trim() || null,
        city: profile?.city || null,
        state: profile?.state || null,
        image_url: imageUrl,
      });
      if (error) throw error;
      router.replace('/(tabs)/marketplace');
    } catch (error: any) {
      Alert.alert('Não foi possível publicar', error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Anunciar peça" subtitle="Marketplace StreetClub" />

        <Text style={styles.label}>Tipo de anúncio</Text>
        <View style={styles.kindRow}>
          <KindButton icon="pricetag-outline" text="Vendo" active={kind === 'sell'} onPress={() => setKind('sell')} />
          <KindButton icon="swap-horizontal-outline" text="Troco" active={kind === 'trade'} onPress={() => setKind('trade')} />
          <KindButton icon="search-outline" text="Procuro" active={kind === 'wanted'} onPress={() => setKind('wanted')} />
        </View>

        <Text style={styles.label}>Foto</Text>
        <Pressable style={styles.photo} onPress={() => { void chooseImage(); }}>
          {image ? <AppImage uri={image.uri} style={StyleSheet.absoluteFill} /> : (
            <View style={styles.photoEmpty}>
              <Ionicons name="camera-outline" size={31} color={theme.colors.accent} />
              <Text style={styles.photoTitle}>Adicionar foto</Text>
              <Text style={styles.photoSub}>Mostre a peça com clareza</Text>
            </View>
          )}
        </Pressable>

        <FormField label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Turbo Garrett GTX" />
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chips}>
          {categories.map((item) => (
            <Pressable key={item} onPress={() => setCategory(item)} style={[styles.chip, category === item && styles.chipOn]}>
              <Text style={[styles.chipText, category === item && styles.chipTextOn]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <FormField label="Compatibilidade" value={compatibility} onChangeText={setCompatibility} placeholder="Ex.: Nissan SR20DET / S13-S15" />
        {kind === 'sell' && <FormField label="Preço (R$)" value={price} onChangeText={setPrice} placeholder="8.500,00" keyboardType="decimal-pad" />}
        <FormField label="Descrição" value={description} onChangeText={setDescription} placeholder="Estado da peça, uso, detalhes da negociação..." multiline />

        <Text style={styles.label}>Relacionar a um carro</Text>
        <View style={styles.chips}>
          <Pressable style={[styles.chip, !carId && styles.chipOn]} onPress={() => setCarId(null)}><Text style={[styles.chipText, !carId && styles.chipTextOn]}>Nenhum</Text></Pressable>
          {myCars.map((car) => (
            <Pressable key={car.id} style={[styles.chip, carId === car.id && styles.chipOn]} onPress={() => setCarId(car.id)}>
              <Text style={[styles.chipText, carId === car.id && styles.chipTextOn]}>{car.make} {car.model}</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton onPress={() => { void save(); }} disabled={saving} style={styles.save}>{saving ? 'Publicando...' : 'Publicar anúncio'}</PrimaryButton>
      </ScrollView>
    </Screen>
  );
}

function KindButton({ icon, text, active, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.kind, active && styles.kindOn]}>
      <Ionicons name={icon} size={18} color={active ? theme.colors.white : theme.colors.muted} />
      <Text style={[styles.kindLabel, active && styles.kindLabelOn]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 38 },
  label: { color: theme.colors.textSoft, fontSize: 11, fontWeight: '800', marginTop: 16, marginBottom: 7, marginHorizontal: 16 },
  kindRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  kind: { flex: 1, minHeight: 52, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  kindOn: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  kindLabel: { color: theme.colors.muted, fontWeight: '900', fontSize: 10.5 },
  kindLabelOn: { color: theme.colors.white },
  photo: { height: 220, marginHorizontal: 16, borderRadius: theme.radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.borderStrong, overflow: 'hidden', backgroundColor: theme.colors.surface },
  photoEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 13, marginTop: 8 },
  photoSub: { color: theme.colors.muted, fontSize: 9.5, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 16 },
  chip: { minHeight: 34, paddingHorizontal: 11, borderRadius: 17, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  chipOn: { borderColor: theme.colors.accent, backgroundColor: '#20080A' },
  chipText: { color: theme.colors.muted, fontSize: 10, fontWeight: '800' },
  chipTextOn: { color: theme.colors.text },
  save: { marginHorizontal: 16, marginTop: 24 },
});
