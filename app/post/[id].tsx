import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type CommentItem = {
  id: string;
  authorId: string;
  author: string;
  avatar: string | null;
  body: string;
  createdAt: string;
};

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, myUserId, togglePostLike, refreshRemoteData } = useApp();
  const insets = useSafeAreaInsets();
  const post = posts.find((item) => item.id === id);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post?.caption || '');

  async function loadComments() {
    if (!supabase || !id) return;
    const { data: rows } = await supabase.from('comments').select('id, author_id, body, created_at').eq('post_id', id).order('created_at', { ascending: true });
    const authorIds = [...new Set((rows ?? []).map((row: any) => row.author_id))];
    const { data: profiles } = authorIds.length ? await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', authorIds) : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    setComments((rows ?? []).map((row: any) => {
      const p: any = map.get(row.author_id);
      return {
        id: row.id,
        authorId: row.author_id,
        author: p?.display_name || p?.username || 'Driver',
        avatar: p?.avatar_url || null,
        body: row.body,
        createdAt: row.created_at,
      };
    }));
  }

  useEffect(() => { void loadComments(); }, [id]);

  async function send() {
    if (!supabase || !myUserId || !text.trim()) return;
    const body = text.trim();
    setText('');
    const { error } = await supabase.from('comments').insert({ post_id: id, author_id: myUserId, body });
    if (error) {
      setText(body);
      return Alert.alert('Comentário', error.message);
    }
    await loadComments();
  }

  async function saveCaption() {
    if (!supabase || !post || post.authorId !== myUserId) return;
    const { error } = await supabase.from('posts').update({ caption: caption.trim() }).eq('id', post.id);
    if (error) return Alert.alert('Editar post', error.message);
    setEditing(false);
    await refreshRemoteData();
  }

  function removePost() {
    if (!supabase || !post || post.authorId !== myUserId) return;
    Alert.alert('Excluir publicação', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error } = await supabase!.from('posts').delete().eq('id', post.id);
        if (error) return Alert.alert('Erro', error.message);
        await refreshRemoteData();
        router.replace('/(tabs)/feed');
      }},
    ]);
  }

  function reportPost() {
    if (!supabase || !myUserId || !post) return;
    Alert.alert('Denunciar publicação', 'Enviar esta publicação para revisão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Denunciar', style: 'destructive', onPress: async () => {
        const { error } = await supabase!.from('reports').insert({ reporter_id: myUserId, target_post_id: post.id, reason: 'Denúncia enviada pela publicação' });
        if (error) Alert.alert('Erro', error.message); else Alert.alert('Denúncia enviada');
      }},
    ]);
  }

  if (!post) return <Screen><View style={styles.center}><Text style={styles.muted}>Publicação não encontrada.</Text></View></Screen>;
  const mine = post.authorId === myUserId;

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹</Text></Pressable>
          <Text style={styles.title}>Publicação</Text>
          <Pressable onPress={mine ? removePost : reportPost} style={styles.menu}><Text style={styles.menuText}>{mine ? 'Excluir' : 'Denunciar'}</Text></Pressable>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View>
              <Pressable style={styles.authorRow} onPress={() => post.authorId && router.push('/user/' + post.authorId)}>
                <AppImage uri={post.authorAvatar} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{post.author[0]}</Text>} />
                <View><Text style={styles.author}>{post.author}</Text><Text style={styles.car}>{post.carName}</Text></View>
              </Pressable>
              <AppImage uri={post.image} style={styles.image} placeholder={<Text style={styles.photoPlaceholder}>📸</Text>} />
              <View style={styles.body}>
                <Pressable onPress={() => { void togglePostLike(post.id); }}>
                  <Text style={[styles.heart, post.liked && { color: theme.colors.accent }]}>{post.liked ? '♥' : '♡'} <Text style={styles.likeCount}>{post.likes}</Text></Text>
                </Pressable>

                {editing ? <>
                  <TextInput style={styles.captionInput} value={caption} onChangeText={setCaption} multiline />
                  <View style={styles.editActions}>
                    <Pressable onPress={() => setEditing(false)}><Text style={styles.cancel}>Cancelar</Text></Pressable>
                    <Pressable onPress={() => { void saveCaption(); }}><Text style={styles.save}>Salvar</Text></Pressable>
                  </View>
                </> : (
                  <Pressable onLongPress={() => mine && setEditing(true)}>
                    <Text style={styles.caption}><Text style={{ fontWeight: '900' }}>{post.author} </Text>{post.caption}</Text>
                    {mine && <Text style={styles.hint}>Segure a legenda para editar</Text>}
                  </Pressable>
                )}
                <Text style={styles.commentsTitle}>Comentários</Text>
              </View>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => (
            <Pressable style={styles.comment} onPress={() => router.push('/user/' + item.authorId)}>
              <AppImage uri={item.avatar} style={styles.commentAvatar} placeholder={<Text style={styles.avatarText}>{item.author[0]}</Text>} />
              <View style={{ flex: 1 }}>
                <Text style={styles.commentBody}><Text style={styles.commentAuthor}>{item.author} </Text>{item.body}</Text>
                <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleString('pt-BR')}</Text>
              </View>
            </Pressable>
          )}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Escreva um comentário..."
            placeholderTextColor={theme.colors.muted}
            multiline
            maxLength={1000}
          />
          <Pressable style={styles.send} onPress={() => { void send(); }}><Text style={styles.sendText}>Enviar</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { color: 'white', fontSize: 38, marginRight: 8, marginTop: -4 },
  title: { color: 'white', fontSize: 23, fontWeight: '900' },
  menu: { marginLeft: 'auto' },
  menuText: { color: '#F07880', fontWeight: '900', fontSize: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { color: 'white', fontWeight: '900' },
  author: { color: 'white', fontWeight: '900', marginLeft: 10 },
  car: { color: theme.colors.muted, fontSize: 11, marginLeft: 10, marginTop: 2 },
  image: { width: '100%', aspectRatio: 1.12 },
  photoPlaceholder: { fontSize: 42 },
  body: { padding: 14 },
  heart: { color: 'white', fontSize: 25 },
  likeCount: { fontSize: 14, fontWeight: '900' },
  caption: { color: '#E7E8EA', lineHeight: 20, marginTop: 9 },
  captionInput: { color: 'white', backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, padding: 12, marginTop: 10, minHeight: 80, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginTop: 8 },
  cancel: { color: theme.colors.muted, fontWeight: '800' },
  save: { color: theme.colors.accent, fontWeight: '900' },
  hint: { color: theme.colors.muted, fontSize: 9, marginTop: 5 },
  commentsTitle: { color: 'white', fontWeight: '900', fontSize: 18, marginTop: 22 },
  comment: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 9, gap: 10 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17 },
  commentBody: { color: '#E7E8EA', lineHeight: 19 },
  commentAuthor: { color: 'white', fontWeight: '900' },
  commentTime: { color: theme.colors.muted, fontSize: 9, marginTop: 3 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: theme.colors.background },
  input: { flex: 1, maxHeight: 110, minHeight: 46, color: 'white', backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 23, paddingHorizontal: 15, paddingVertical: 11 },
  send: { backgroundColor: theme.colors.accent, height: 46, borderRadius: 23, paddingHorizontal: 15, justifyContent: 'center' },
  sendText: { color: 'white', fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
});
