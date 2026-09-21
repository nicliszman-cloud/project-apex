import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { theme } from '@/lib/theme';

export default function ChatScreen() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([{ id: '1', mine: false, text: 'Curti muito seu projeto. Vai no meet sábado?' }, { id: '2', mine: true, text: 'Vou sim. Quero chegar cedo.' }]);
  function send() { if (!text.trim()) return; setMessages((m) => [...m, { id: String(Date.now()), mine: true, text: text.trim() }]); setText(''); }
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable><View style={styles.avatar}><Text style={styles.avatarText}>M</Text></View><View><Text style={styles.name}>Marina</Text><Text style={styles.status}>BMW M3 Competition • Garage Match</Text></View></View>
        <FlatList data={messages} keyExtractor={(m) => m.id} contentContainerStyle={styles.list} renderItem={({ item }) => <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}><Text style={styles.message}>{item.text}</Text></View>} />
        <View style={styles.composer}><TextInput value={text} onChangeText={setText} placeholder="Mensagem..." placeholderTextColor={theme.colors.muted} style={styles.input} onSubmitEditing={send}/><Pressable style={styles.send} onPress={send}><Text style={styles.sendText}>➤</Text></Pressable></View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { height: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, back: { color: 'white', fontSize: 38, marginRight: 10, marginTop: -4 }, avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: 'white', fontWeight: '900' }, name: { color: 'white', fontWeight: '900', marginLeft: 10 }, status: { color: theme.colors.muted, fontSize: 10, marginLeft: 10, marginTop: 2 }, list: { padding: 14, gap: 8 }, bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 }, mine: { alignSelf: 'flex-end', backgroundColor: theme.colors.accent, borderBottomRightRadius: 5 }, theirs: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface2, borderBottomLeftRadius: 5 }, message: { color: 'white', lineHeight: 19 }, composer: { flexDirection: 'row', gap: 9, padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }, input: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, color: 'white', paddingHorizontal: 16, paddingVertical: 12 }, send: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }, sendText: { color: 'white', fontSize: 18 },
});
