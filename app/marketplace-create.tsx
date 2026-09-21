import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { LocalImage, pickImages, uploadPublicImage } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type Kind = 'sell' | 'trade' | 'wanted';

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
    if (!title.trim()) return Alert.alert('Título obrigatório');
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
      Alert.alert('Anúncio criado', 'Ele já está disponível no marketplace.');
      router.replace('/marketplace');
    } catch (error: any) {
      Alert.alert('Não foi possível criar', error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>Novo anúncio</Text></View>

        <Text style={styles.label}>Tipo</Text>
        <View style={styles.chips}>{([['sell','Vendo'],['trade','Troco'],['wanted','Procuro']] as [Kind,string][]).map(([value,label]) => <Pressable key={value} style={[styles.chip, kind === value && styles.chipOn]} onPress={() => setKind(value)}><Text style={[styles.chipText, kind === value && styles.chipTextOn]}>{label}</Text></Pressable>)}</View>

        <Field label="Título" value={title} onChangeText={setTitle} placeholder="Ex.: Downpipe para BMW M3 G80" />
        <Field label="Categoria" value={category} onChangeText={setCategory} placeholder="Escape, rodas, suspensão..." />
        <Field label="Compatibilidade" value={compatibility} onChangeText={setCompatibility} placeholder="Ex.: BMW M3/M4 G8x 2021+" />
        {kind === 'sell' && <Field label="Preço (R$)" value={price} onChangeText={setPrice} placeholder="3500,00" keyboardType="decimal-pad" />}
        <Field label="Descrição" value={description} onChangeText={setDescription} placeholder="Estado da peça, tempo de uso, detalhes..." multiline />

        <Text style={styles.label}>Relacionar a um carro (opcional)</Text>
        <View style={styles.chips}>
          <Pressable style={[styles.chip, !carId && styles.chipOn]} onPress={() => setCarId(null)}><Text style={[styles.chipText, !carId && styles.chipTextOn]}>Nenhum</Text></Pressable>
          {myCars.map((car) => <Pressable key={car.id} style={[styles.chip, carId === car.id && styles.chipOn]} onPress={() => setCarId(car.id)}><Text style={[styles.chipText, carId === car.id && styles.chipTextOn]}>{car.make} {car.model}</Text></Pressable>)}
        </View>

        <Text style={styles.label}>Foto</Text>
        <Pressable style={styles.photo} onPress={chooseImage}>{image ? <Image source={{ uri: image.uri }} style={styles.image} /> : <><Text style={styles.plus}>＋</Text><Text style={styles.photoText}>Adicionar foto</Text></>}</Pressable>

        <Pressable style={styles.save} onPress={save} disabled={saving}><Text style={styles.saveText}>{saving ? 'Publicando...' : 'Publicar anúncio'}</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}

function Field({ label, multiline, ...props }: any) {
  return <View><Text style={styles.label}>{label}</Text><TextInput {...props} multiline={multiline} style={[styles.input, multiline && styles.multiline]} placeholderTextColor={theme.colors.muted} textAlignVertical={multiline ? 'top' : 'center'} /></View>;
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center' },
  back: { color: 'white', fontSize: 38, marginRight: 10, marginTop: -4 },
  title: { color: 'white', fontSize: 27, fontWeight: '900' },
  label: { color: '#D8DADE', fontWeight: '800', fontSize: 12, marginTop: 18, marginBottom: 7 },
  input: { backgroundColor: theme.colors.surface, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 },
  multiline: { minHeight: 105 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9 },
  chipOn: { backgroundColor: '#402015', borderColor: theme.colors.accent },
  chipText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: '#FF8A65' },
  photo: { height: 190, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3A3F49', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: theme.colors.surface },
  image: { width: '100%', height: '100%' },
  plus: { color: theme.colors.accent, fontSize: 30 },
  photoText: { color: 'white', fontWeight: '900', marginTop: 4 },
  save: { backgroundColor: theme.colors.accent, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 24 },
  saveText: { color: 'white', fontWeight: '900' },
});
