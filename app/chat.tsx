import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const { matches, myUserId, isDemo } = useApp();
  const match = useMemo(() => matches.find((item) => item.id === matchId), [matches, matchId]);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(isDemo || !matchId ? [
    { id: '1', senderId: 'other', text: 'Curti muito seu projeto. Vai no meet sábado?', createdAt: new Date().toISOString() },
    { id: '2', senderId: 'me', text: 'Vou sim. Quero chegar cedo.', createdAt: new Date().toISOString() },
  ] : []);
  const [loading, setLoading] = useState(Boolean(matchId && !isDemo));

  useEffect(() => {
    if (isDemo || !matchId || !supabase) return;

    let active = true;

    async function load() {
      const { data, error } = await supabase!
        .from('messages')
        .select('id, sender_id, body, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (!active) return;
      if (error) {
        Alert.alert('Chat', error.message);
      } else {
        setMessages((data ?? []).map((row: any) => ({
          id: row.id,
          senderId: row.sender_id,
          text: row.body,
          createdAt: row.created_at,
        })));
      }
      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel('match-' + matchId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: 'match_id=eq.' + matchId,
      }, (payload: any) => {
        const row = payload.new;
        setMessages((current) => current.some((item) => item.id === row.id) ? current : [...current, {
          id: row.id,
          senderId: row.sender_id,
          text: row.body,
          createdAt: row.created_at,
        }]);
      })
      .subscribe();

    return () => {
      active = false;
      void supabase!.removeChannel(channel);
    };
  }, [isDemo, matchId]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    setText('');

    if (isDemo || !matchId || !supabase || !myUserId) {
      setMessages((current) => [...current, { id: String(Date.now()), senderId: 'me', text: body, createdAt: new Date().toISOString() }]);
      return;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: myUserId, body })
      .select('id, sender_id, body, created_at')
      .single();

    if (error) {
      setText(body);
      return Alert.alert('Não foi possível enviar', error.message);
    }

    setMessages((current) => current.some((item) => item.id === data.id) ? current : [...current, {
      id: data.id,
      senderId: data.sender_id,
      text: data.body,
      createdAt: data.created_at,
    }]);
  }

  const partnerName = match?.partnerName || 'Marina';
  const partnerCar = match?.partnerCarName || 'BMW M3 Competition';

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          {match?.partnerCarImage ? <Image source={{ uri: match.partnerCarImage }} style={styles.avatarImage} /> : <View style={styles.avatar}><Text style={styles.avatarText}>{partnerName[0]}</Text></View>}
          <View><Text style={styles.name}>{partnerName}</Text><Text style={styles.status}>{partnerCar} • Garage Match</Text></View>
        </View>

        {loading ? <View style={styles.loading}><Text style={styles.loadingText}>Carregando conversa...</Text></View> : (
          <FlatList
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const mine = isDemo ? item.senderId === 'me' : item.senderId === myUserId;
              return <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={styles.message}>{item.text}</Text></View>;
            }}
          />
        )}

        <View style={styles.composer}>
          <TextInput value={text} onChangeText={setText} placeholder="Mensagem..." placeholderTextColor={theme.colors.muted} style={styles.input} onSubmitEditing={send}/>
          <Pressable style={styles.send} onPress={send}><Text style={styles.sendText}>➤</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: 'white', fontSize: 38, marginRight: 10, marginTop: -4 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { color: 'white', fontWeight: '900' },
  name: { color: 'white', fontWeight: '900', marginLeft: 10 },
  status: { color: theme.colors.muted, fontSize: 10, marginLeft: 10, marginTop: 2 },
  list: { padding: 14, gap: 8 },
  bubble: { maxWidth: '80%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  mine: { alignSelf: 'flex-end', backgroundColor: theme.colors.accent, borderBottomRightRadius: 5 },
  theirs: { alignSelf: 'flex-start', backgroundColor: theme.colors.surface2, borderBottomLeftRadius: 5 },
  message: { color: 'white', lineHeight: 19 },
  composer: { flexDirection: 'row', gap: 9, padding: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  input: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, color: 'white', paddingHorizontal: 16, paddingVertical: 12 },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: 'white', fontSize: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: theme.colors.muted },
});
