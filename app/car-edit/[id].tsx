import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { LocalImage, pickImages, storagePathFromPublicUrl, uploadPublicImage } from '@/lib/media';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { CarCategory } from '@/types';

const categories: CarCategory[] = ['JDM', 'Euro', 'Muscle', 'Supercar', 'Hot Hatch', 'Track'];

export default function CarEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cars, myUserId, refreshRemoteData } = useApp();
  const car = cars.find((item) => item.id === id);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState('');
  const [drivetrain, setDrivetrain] = useState('');
  const [stockHp, setStockHp] = useState('');
  const [currentHp, setCurrentHp] = useState('');
  const [category, setCategory] = useState<CarCategory>('Euro');
  const [mods, setMods] = useState('');
  const [replacementImages, setReplacementImages] = useState<LocalImage[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!car) return;
    setMake(car.make);
    setModel(car.model);
    setYear(String(car.year));
    setEngine(car.engine);
    setTransmission(car.transmission);
    setDrivetrain(car.drivetrain);
    setStockHp(String(car.stockHp));
    setCurrentHp(String(car.currentHp));
    setCategory(car.category);
    setMods(car.modifications.join('\n'));
  }, [car?.id]);

  async function choosePhotos() {
    try {
      const selected = await pickImages(true);
      if (selected.length) setReplacementImages(selected);
    } catch (error: any) {
      Alert.alert('Fotos', error?.message ?? 'Não foi possível abrir a galeria.');
    }
  }

  async function save() {
    if (!supabase || !car || car.ownerId !== myUserId || !myUserId) return;
    if (!make.trim() || !model.trim()) return Alert.alert('Dados do carro', 'Marca e modelo são obrigatórios.');

    setSaving(true);
    try {
      const { error } = await supabase.from('cars').update({
        make: make.trim(),
        model: model.trim(),
        model_year: Number(year),
        engine: engine.trim(),
        transmission: transmission.trim(),
        drivetrain: drivetrain.trim(),
        stock_hp: Number(stockHp || 0),
        current_hp: Number(currentHp || 0),
        category,
        modifications: mods.split('\n').map((m) => m.trim()).filter(Boolean),
      }).eq('id', car.id);
      if (error) throw error;

      if (replacementImages.length) {
        const { data: oldPhotos } = await supabase.from('car_photos').select('url').eq('car_id', car.id);

        const urls: string[] = [];
        for (let i = 0; i < replacementImages.length; i++) {
          urls.push(await uploadPublicImage(myUserId, replacementImages[i], 'cars/' + car.id));
        }

        const { error: deleteRowsError } = await supabase.from('car_photos').delete().eq('car_id', car.id);
        if (deleteRowsError) throw deleteRowsError;

        const { error: insertError } = await supabase.from('car_photos').insert(
          urls.map((url, position) => ({ car_id: car.id, url, position }))
        );
        if (insertError) throw insertError;

        const { error: coverError } = await supabase.from('cars').update({ cover_url: urls[0] }).eq('id', car.id);
        if (coverError) throw coverError;

        const oldPaths = (oldPhotos ?? []).map((row: any) => storagePathFromPublicUrl(row.url)).filter(Boolean) as string[];
        if (oldPaths.length) {
          await supabase.storage.from('media').remove(oldPaths);
        }
      }

      await refreshRemoteData();
      router.replace('/car/' + car.id);
    } catch (error: any) {
      Alert.alert('Editar carro', error?.message ?? 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  if (!car || car.ownerId !== myUserId) return <Screen><View style={styles.center}><Text style={styles.muted}>Você não pode editar este carro.</Text></View></Screen>;

  const currentImages = car.images?.length ? car.images : [car.image];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><Text style={styles.title}>Editar carro</Text></View>

        <Text style={styles.label}>Fotos</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
          {(replacementImages.length ? replacementImages.map((item) => item.uri) : currentImages).map((uri, index) => (
            <AppImage key={uri + index} uri={uri} style={styles.photo} placeholder={<Text style={styles.photoIcon}>🏎️</Text>} />
          ))}
        </ScrollView>
        <Pressable style={styles.photoButton} onPress={() => { void choosePhotos(); }}>
          <Text style={styles.photoButtonText}>{replacementImages.length ? 'Trocar seleção de fotos' : 'Adicionar / trocar fotos'}</Text>
        </Pressable>
        <Text style={styles.photoHelp}>Até 6 fotos. Ao salvar uma nova seleção, ela substitui a galeria atual.</Text>

        <Field label="Marca" value={make} onChangeText={setMake} />
        <Field label="Modelo" value={model} onChangeText={setModel} />
        <Field label="Ano" value={year} onChangeText={setYear} keyboardType="number-pad" />
        <Field label="Motor" value={engine} onChangeText={setEngine} />
        <Field label="Câmbio" value={transmission} onChangeText={setTransmission} />
        <Field label="Tração" value={drivetrain} onChangeText={setDrivetrain} />
        <Field label="Potência original" value={stockHp} onChangeText={setStockHp} keyboardType="number-pad" />
        <Field label="Potência atual" value={currentHp} onChangeText={setCurrentHp} keyboardType="number-pad" />
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.chips}>{categories.map((item) => <Pressable key={item} style={[styles.chip, category === item && styles.chipOn]} onPress={() => setCategory(item)}><Text style={[styles.chipText, category === item && styles.chipTextOn]}>{item}</Text></Pressable>)}</View>
        <Field label="Modificações" value={mods} onChangeText={setMods} multiline />
        <Pressable style={styles.save} onPress={() => { void save(); }} disabled={saving}><Text style={styles.saveText}>{saving ? 'Salvando...' : 'Salvar alterações'}</Text></Pressable>
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
  photoRow: { gap: 8, paddingVertical: 2 },
  photo: { width: 100, height: 100, borderRadius: 14 },
  photoIcon: { fontSize: 32 },
  photoButton: { borderWidth: 1, borderColor: theme.colors.accent, borderRadius: 13, padding: 12, alignItems: 'center', marginTop: 10 },
  photoButtonText: { color: '#FF8A65', fontWeight: '900' },
  photoHelp: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: 7 },
  input: { backgroundColor: theme.colors.surface, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 },
  multiline: { minHeight: 110 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { borderColor: theme.colors.accent, backgroundColor: '#402015' },
  chipText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: '#FF8A65' },
  save: { backgroundColor: theme.colors.accent, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  saveText: { color: 'white', fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
});
