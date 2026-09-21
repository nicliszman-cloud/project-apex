import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { LocalImage, pickImages } from '@/lib/media';
import { theme } from '@/lib/theme';
import { CarCategory } from '@/types';

type Mode = 'car' | 'post' | 'event';
const categories: CarCategory[] = ['JDM', 'Euro', 'Muscle', 'Supercar', 'Hot Hatch', 'Track'];
const drivetrains = ['RWD', 'AWD', 'FWD'];

export default function CreateScreen() {
  const { addCar, createPost, createEvent, profile, cars, myUserId, isDemo } = useApp();
  const [mode, setMode] = useState<Mode>('car');
  const [saving, setSaving] = useState(false);

  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [engine, setEngine] = useState('');
  const [transmission, setTransmission] = useState('');
  const [drivetrain, setDrivetrain] = useState('RWD');
  const [stockHp, setStockHp] = useState('');
  const [currentHp, setCurrentHp] = useState('');
  const [category, setCategory] = useState<CarCategory>('JDM');
  const [mods, setMods] = useState('');
  const [carImages, setCarImages] = useState<LocalImage[]>([]);

  const [postCaption, setPostCaption] = useState('');
  const [postImage, setPostImage] = useState<LocalImage | null>(null);
  const myCars = useMemo(() => cars.filter((car) => car.ownerId === myUserId), [cars, myUserId]);
  const [postCarId, setPostCarId] = useState<string | null>(null);

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCategory, setEventCategory] = useState('Meet');
  const [eventVenue, setEventVenue] = useState('');
  const [eventCity, setEventCity] = useState(profile?.city || '');
  const [eventState, setEventState] = useState(profile?.state || '');
  const [eventStarts, setEventStarts] = useState('');
  const [eventImage, setEventImage] = useState<LocalImage | null>(null);

  async function chooseCarImages() {
    try {
      const selected = await pickImages(true);
      if (selected.length) setCarImages(selected);
    } catch (error: any) {
      Alert.alert('Fotos', error?.message ?? 'Não foi possível abrir a galeria.');
    }
  }

  async function chooseSingle(setter: (value: LocalImage) => void) {
    try {
      const selected = await pickImages(false);
      if (selected[0]) setter(selected[0]);
    } catch (error: any) {
      Alert.alert('Foto', error?.message ?? 'Não foi possível abrir a galeria.');
    }
  }

  async function saveCar() {
    if (!make.trim() || !model.trim() || !year.trim()) {
      return Alert.alert('Falta pouco', 'Preencha marca, modelo e ano.');
    }
    const parsedYear = Number(year);
    if (!Number.isFinite(parsedYear) || parsedYear < 1886 || parsedYear > new Date().getFullYear() + 1) {
      return Alert.alert('Ano inválido', 'Confira o ano do carro.');
    }

    setSaving(true);
    try {
      await addCar({
        make: make.trim(),
        model: model.trim(),
        year: parsedYear,
        engine: engine.trim() || 'Não informado',
        transmission: transmission.trim() || 'Não informado',
        drivetrain,
        stockHp: Number(stockHp || 0),
        currentHp: Number(currentHp || stockHp || 0),
        city: profile?.city || 'Não informado',
        state: profile?.state || 'BR',
        category,
        image: carImages[0]?.uri || '',
        modifications: mods.split('\n').map((item) => item.trim()).filter(Boolean),
        tags: [category, 'Build'],
      }, carImages);
      Alert.alert('Carro adicionado', isDemo ? 'Salvo no modo demo.' : 'Carro e fotos salvos no Supabase.');
      router.replace('/(tabs)/garage');
    } catch (error: any) {
      Alert.alert('Não foi possível salvar', error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function savePost() {
    if (!postImage) return Alert.alert('Escolha uma foto', 'O post precisa de uma imagem.');
    if (!postCaption.trim()) return Alert.alert('Escreva uma legenda', 'Conte algo sobre o carro ou projeto.');

    setSaving(true);
    try {
      await createPost({ caption: postCaption.trim(), carId: postCarId, image: postImage });
      Alert.alert('Publicado', 'Seu post já está no feed.');
      router.replace('/(tabs)/feed');
    } catch (error: any) {
      Alert.alert('Não foi possível publicar', error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function saveEvent() {
    const parsed = new Date(eventStarts.replace(' ', 'T'));
    if (!eventTitle.trim() || !eventVenue.trim() || !eventCity.trim() || !eventState.trim()) {
      return Alert.alert('Faltam informações', 'Preencha título, local, cidade e UF.');
    }
    if (!eventStarts.trim() || Number.isNaN(parsed.getTime())) {
      return Alert.alert('Data inválida', 'Use o formato 2026-10-04 09:00.');
    }

    setSaving(true);
    try {
      await createEvent({
        title: eventTitle.trim(),
        description: eventDescription.trim(),
        category: eventCategory.trim() || 'Meet',
        venueName: eventVenue.trim(),
        city: eventCity.trim(),
        state: eventState.trim().toUpperCase(),
        startsAt: parsed.toISOString(),
        image: eventImage,
      });
      Alert.alert('Evento criado', 'Ele já aparece em Meets e você foi marcado como participante.');
      router.replace('/(tabs)/meets');
    } catch (error: any) {
      Alert.alert('Não foi possível criar', error?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar</Text>
        <Text style={styles.sub}>{isDemo ? 'Modo demo ativo.' : 'Tudo aqui será salvo na sua conta real.'}</Text>

        <View style={styles.switcher}>
          <ModeButton active={mode === 'car'} text="🏎️ Carro" onPress={() => setMode('car')} />
          <ModeButton active={mode === 'post'} text="📸 Post" onPress={() => setMode('post')} />
          <ModeButton active={mode === 'event'} text="📍 Evento" onPress={() => setMode('event')} />
        </View>

        {mode === 'car' && <>
          <Field label="Marca" value={make} onChangeText={setMake} placeholder="Toyota" />
          <Field label="Modelo" value={model} onChangeText={setModel} placeholder="Supra MK4" />
          <Field label="Motor" value={engine} onChangeText={setEngine} placeholder="3.0 2JZ-GTE biturbo" />
          <Field label="Câmbio" value={transmission} onChangeText={setTransmission} placeholder="Manual 6 marchas" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Field label="Ano" value={year} onChangeText={setYear} placeholder="2000" keyboardType="number-pad" /></View>
            <View style={{ flex: 1 }}><Field label="Potência original" value={stockHp} onChangeText={setStockHp} placeholder="280" keyboardType="number-pad" /></View>
          </View>
          <Field label="Potência atual (cv)" value={currentHp} onChangeText={setCurrentHp} placeholder="780" keyboardType="number-pad" />
          <Text style={styles.label}>Tração</Text>
          <View style={styles.chips}>{drivetrains.map((item) => <Chip key={item} text={item} active={drivetrain === item} onPress={() => setDrivetrain(item)} />)}</View>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.chips}>{categories.map((item) => <Chip key={item} text={item} active={category === item} onPress={() => setCategory(item)} />)}</View>
          <Field label="Modificações" value={mods} onChangeText={setMods} placeholder={'Uma por linha\nStage 2\nSuspensão coilover\nRodas 18”'} multiline />

          <Text style={styles.label}>Fotos do carro</Text>
          <Pressable style={styles.photo} onPress={chooseCarImages}>
            <Text style={styles.photoIcon}>＋</Text>
            <Text style={styles.photoText}>{carImages.length ? carImages.length + ' foto(s) selecionada(s)' : 'Escolher da galeria'}</Text>
            <Text style={styles.photoSub}>Até 6 fotos. A primeira será a capa.</Text>
          </Pressable>
          {!!carImages.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow}>{carImages.map((image, index) => <Image key={image.uri + '-' + index} source={{ uri: image.uri }} style={styles.preview} />)}</ScrollView>}

          <Pressable style={styles.save} onPress={saveCar} disabled={saving}><Text style={styles.saveText}>{saving ? 'Salvando...' : 'Adicionar à garagem'}</Text></Pressable>
        </>}

        {mode === 'post' && <>
          <Text style={styles.label}>Foto</Text>
          <Pressable style={[styles.photo, postImage && styles.photoWithImage]} onPress={() => chooseSingle(setPostImage)}>
            {postImage ? <Image source={{ uri: postImage.uri }} style={styles.postPreview} /> : <>
              <Text style={styles.photoIcon}>＋</Text><Text style={styles.photoText}>Escolher foto</Text>
            </>}
          </Pressable>
          <Field label="Legenda" value={postCaption} onChangeText={setPostCaption} placeholder="Conte sobre o projeto..." multiline />
          <Text style={styles.label}>Relacionar a um carro (opcional)</Text>
          <View style={styles.chips}>
            <Chip text="Nenhum" active={!postCarId} onPress={() => setPostCarId(null)} />
            {myCars.map((car) => <Chip key={car.id} text={car.make + ' ' + car.model} active={postCarId === car.id} onPress={() => setPostCarId(car.id)} />)}
          </View>
          <Pressable style={styles.save} onPress={savePost} disabled={saving}><Text style={styles.saveText}>{saving ? 'Publicando...' : 'Publicar no feed'}</Text></Pressable>
        </>}

        {mode === 'event' && <>
          <Field label="Título" value={eventTitle} onChangeText={setEventTitle} placeholder="JDM Night Meet" />
          <Field label="Categoria" value={eventCategory} onChangeText={setEventCategory} placeholder="Meet, Track Day, Exposição..." />
          <Field label="Descrição" value={eventDescription} onChangeText={setEventDescription} placeholder="Informações, regras e detalhes do encontro..." multiline />
          <Field label="Local" value={eventVenue} onChangeText={setEventVenue} placeholder="Nome do local" />
          <View style={styles.row}>
            <View style={{ flex: 1 }}><Field label="Cidade" value={eventCity} onChangeText={setEventCity} placeholder="Cascavel" /></View>
            <View style={{ width: 90 }}><Field label="UF" value={eventState} onChangeText={setEventState} placeholder="PR" /></View>
          </View>
          <Field label="Data e horário" value={eventStarts} onChangeText={setEventStarts} placeholder="2026-10-04 09:00" />
          <Text style={styles.label}>Capa do evento</Text>
          <Pressable style={[styles.photo, eventImage && styles.photoWithImage]} onPress={() => chooseSingle(setEventImage)}>
            {eventImage ? <Image source={{ uri: eventImage.uri }} style={styles.postPreview} /> : <>
              <Text style={styles.photoIcon}>＋</Text><Text style={styles.photoText}>Escolher foto</Text>
            </>}
          </Pressable>
          <Pressable style={styles.save} onPress={saveEvent} disabled={saving}><Text style={styles.saveText}>{saving ? 'Criando...' : 'Criar evento'}</Text></Pressable>
        </>}
      </ScrollView>
    </Screen>
  );
}

function ModeButton({ active, text, onPress }: { active: boolean; text: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.mode, active && styles.modeOn]}><Text style={[styles.modeText, active && styles.modeTextOn]}>{text}</Text></Pressable>;
}

function Chip({ active, text, onPress }: { active: boolean; text: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}><Text style={[styles.chipText, active && styles.chipTextOn]}>{text}</Text></Pressable>;
}

function Field(props: any) {
  return <View><Text style={styles.label}>{props.label}</Text><TextInput {...props} label={undefined} style={[styles.input, props.multiline && styles.multiline]} placeholderTextColor={theme.colors.muted} textAlignVertical={props.multiline ? 'top' : 'center'} /></View>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 50 },
  title: { color: 'white', fontSize: 31, fontWeight: '900' },
  sub: { color: theme.colors.muted, marginTop: 5 },
  switcher: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 5, marginTop: 22 },
  mode: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  modeOn: { backgroundColor: theme.colors.accent },
  modeText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 },
  modeTextOn: { color: 'white' },
  label: { color: '#D8DADE', fontWeight: '800', fontSize: 12, marginTop: 18, marginBottom: 7 },
  input: { backgroundColor: theme.colors.surface, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 },
  multiline: { minHeight: 100 },
  row: { flexDirection: 'row', gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 99 },
  chipOn: { borderColor: theme.colors.accent, backgroundColor: '#402015' },
  chipText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: '#FF8A65' },
  photo: { minHeight: 130, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3A3F49', borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0F12', overflow: 'hidden' },
  photoWithImage: { borderStyle: 'solid' },
  photoIcon: { color: theme.colors.accent, fontSize: 28 },
  photoText: { color: 'white', fontWeight: '900', marginTop: 4 },
  photoSub: { color: theme.colors.muted, fontSize: 10, marginTop: 6 },
  previewRow: { marginTop: 10 },
  preview: { width: 86, height: 86, borderRadius: 12, marginRight: 8 },
  postPreview: { width: '100%', height: 230 },
  save: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 24 },
  saveText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
