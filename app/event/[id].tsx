import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { events, myUserId, toggleEvent, refreshRemoteData } = useApp();
  const event = events.find((item) => item.id === id);
  const mine = event?.organizerId === myUserId;
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');

  async function save() {
    if (!supabase || !event || !mine) return;
    const { error } = await supabase.from('events').update({ title: title.trim(), description: description.trim() || null }).eq('id', event.id);
    if (error) return Alert.alert('Editar evento', error.message);
    await refreshRemoteData();
    setEditing(false);
  }

  function remove() {
    if (!supabase || !event || !mine) return;
    Alert.alert('Excluir evento', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error } = await supabase!.from('events').delete().eq('id', event.id);
        if (error) return Alert.alert('Erro', error.message);
        await refreshRemoteData();
        router.replace('/(tabs)/meets');
      }},
    ]);
  }

  if (!event) return <Screen><View style={styles.center}><Text style={styles.muted}>Evento não encontrado.</Text></View></Screen>;

  return (
    <Screen>
      <ScrollView>
        <View><AppImage uri={event.image} style={styles.hero} placeholder={<Text style={styles.heroPlaceholder}>📍</Text>} /><Pressable style={styles.backButton} onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable></View>
        <View style={styles.body}>
          <Text style={styles.category}>{event.category}</Text>
          {editing ? <>
            <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} />
            <TextInput style={styles.descriptionInput} value={description} onChangeText={setDescription} multiline placeholder="Descrição" placeholderTextColor={theme.colors.muted} />
          </> : <>
            <Text style={styles.title}>{event.title}</Text>
            {!!event.description && <Text style={styles.description}>{event.description}</Text>}
          </>}
          <Text style={styles.date}>{event.date}</Text>
          <Text style={styles.place}>📍 {event.place} • {event.city}</Text>
          <Text style={styles.people}>{event.attendees} confirmados</Text>

          <Pressable style={[styles.join, event.joined && styles.joined]} onPress={() => { void toggleEvent(event.id); }}><Text style={styles.joinText}>{event.joined ? 'Confirmado ✓' : 'Eu vou'}</Text></Pressable>

          {mine && <View style={styles.ownerActions}>
            {editing ? <>
              <Pressable style={styles.secondary} onPress={() => setEditing(false)}><Text style={styles.secondaryText}>Cancelar</Text></Pressable>
              <Pressable style={styles.primary} onPress={() => { void save(); }}><Text style={styles.primaryText}>Salvar</Text></Pressable>
            </> : <>
              <Pressable style={styles.secondary} onPress={() => setEditing(true)}><Text style={styles.secondaryText}>Editar</Text></Pressable>
              <Pressable style={styles.deleteButton} onPress={remove}><Text style={styles.deleteText}>Excluir</Text></Pressable>
            </>}
          </View>}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 300 },
  heroPlaceholder: { fontSize: 48 },
  backButton: { position: 'absolute', top: 14, left: 14, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,.6)', alignItems: 'center', justifyContent: 'center' },
  back: { color: 'white', fontSize: 38, marginTop: -4 },
  body: { padding: 20 },
  category: { color: theme.colors.accent, fontWeight: '900', letterSpacing: 1.2, fontSize: 11 },
  title: { color: 'white', fontSize: 29, fontWeight: '900', marginTop: 5 },
  description: { color: '#D8DADE', lineHeight: 20, marginTop: 10 },
  date: { color: 'white', fontWeight: '900', marginTop: 18 },
  place: { color: theme.colors.muted, marginTop: 7 },
  people: { color: theme.colors.muted, marginTop: 7 },
  join: { backgroundColor: theme.colors.accent, padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  joined: { backgroundColor: '#1C6B49' },
  joinText: { color: 'white', fontWeight: '900' },
  ownerActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondary: { flex: 1, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, padding: 14, alignItems: 'center' },
  secondaryText: { color: 'white', fontWeight: '900' },
  primary: { flex: 1, backgroundColor: theme.colors.accent, borderRadius: 14, padding: 14, alignItems: 'center' },
  primaryText: { color: 'white', fontWeight: '900' },
  deleteButton: { flex: 1, borderWidth: 1, borderColor: '#68343A', borderRadius: 14, padding: 14, alignItems: 'center' },
  deleteText: { color: '#F07880', fontWeight: '900' },
  titleInput: { color: 'white', fontSize: 24, fontWeight: '900', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, marginTop: 8 },
  descriptionInput: { color: 'white', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 12, minHeight: 110, marginTop: 10, textAlignVertical: 'top' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
});
