import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function CreateScreen() {
  const { addCar } = useApp();
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [hp, setHp] = useState('');

  function save() {
    if (!make || !model || !year) return Alert.alert('Falta pouco', 'Preencha marca, modelo e ano.');
    addCar({ make, model, year: Number(year), engine: 'Não informado', transmission: 'Não informado', drivetrain: 'RWD', stockHp: Number(hp || 0), currentHp: Number(hp || 0), city: 'Sua cidade', state: 'BR', category: 'Euro', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1400&q=85', modifications: [], tags: ['Novo projeto'] });
    Alert.alert('Carro adicionado', 'Ele já aparece na sua garagem demo.');
    router.replace('/(tabs)/garage');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar</Text><Text style={styles.sub}>Comece adicionando um carro à sua garagem.</Text>
        <View style={styles.switcher}><View style={styles.on}><Text style={styles.onText}>🏎️ Carro</Text></View><View style={styles.off}><Text style={styles.offText}>📸 Post</Text></View><View style={styles.off}><Text style={styles.offText}>📍 Evento</Text></View></View>
        <Text style={styles.label}>Marca</Text><TextInput style={styles.input} placeholder="Ex.: BMW" placeholderTextColor={theme.colors.muted} value={make} onChangeText={setMake}/>
        <Text style={styles.label}>Modelo</Text><TextInput style={styles.input} placeholder="Ex.: M3 Competition" placeholderTextColor={theme.colors.muted} value={model} onChangeText={setModel}/>
        <View style={styles.row}><View style={{ flex: 1 }}><Text style={styles.label}>Ano</Text><TextInput style={styles.input} placeholder="2024" placeholderTextColor={theme.colors.muted} keyboardType="number-pad" value={year} onChangeText={setYear}/></View><View style={{ flex: 1 }}><Text style={styles.label}>Potência atual</Text><TextInput style={styles.input} placeholder="510 cv" placeholderTextColor={theme.colors.muted} keyboardType="number-pad" value={hp} onChangeText={setHp}/></View></View>
        <Text style={styles.label}>Fotos</Text><Pressable style={styles.photo}><Text style={styles.photoIcon}>＋</Text><Text style={styles.photoText}>Adicionar fotos</Text><Text style={styles.photoSub}>Upload real entra quando conectarmos o Storage do Supabase.</Text></Pressable>
        <Pressable style={styles.save} onPress={save}><Text style={styles.saveText}>Adicionar à garagem</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 }, title: { color: 'white', fontSize: 31, fontWeight: '900' }, sub: { color: theme.colors.muted, marginTop: 5 }, switcher: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, padding: 5, marginTop: 22 }, on: { flex: 1, backgroundColor: theme.colors.accent, borderRadius: 11, paddingVertical: 10, alignItems: 'center' }, off: { flex: 1, paddingVertical: 10, alignItems: 'center' }, onText: { color: 'white', fontWeight: '900', fontSize: 12 }, offText: { color: theme.colors.muted, fontWeight: '800', fontSize: 12 }, label: { color: '#D8DADE', fontWeight: '800', fontSize: 12, marginTop: 18, marginBottom: 7 }, input: { backgroundColor: theme.colors.surface, color: 'white', borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14 }, row: { flexDirection: 'row', gap: 12 }, photo: { height: 145, borderWidth: 1, borderStyle: 'dashed', borderColor: '#3A3F49', borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D0F12' }, photoIcon: { color: theme.colors.accent, fontSize: 28 }, photoText: { color: 'white', fontWeight: '900', marginTop: 4 }, photoSub: { color: theme.colors.muted, fontSize: 10, marginTop: 6, textAlign: 'center', paddingHorizontal: 20 }, save: { backgroundColor: theme.colors.accent, padding: 16, borderRadius: 15, alignItems: 'center', marginTop: 24 }, saveText: { color: 'white', fontWeight: '900', fontSize: 15 },
});
