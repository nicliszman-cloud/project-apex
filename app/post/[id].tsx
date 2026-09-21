import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';

type CommentItem = { id: string; authorId: string; author: string; avatar: string | null; body: string; createdAt: string; };

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { posts, cars, myUserId, togglePostLike, refreshRemoteData } = useApp();
  const insets = useSafeAreaInsets();
  const post = posts.find((item) => item.id === id);
  const linkedCar = post?.carId ? cars.find((car) => car.id === post.carId) : undefined;
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(post?.caption || '');
  const [saved, setSaved] = useState(false);

  async function loadComments() {
    if (!supabase || !id) return;
    const { data: rows } = await supabase.from('comments').select('id, author_id, body, created_at').eq('post_id', id).order('created_at', { ascending: true });
    const authorIds = [...new Set((rows ?? []).map((row: any) => row.author_id))];
    const { data: profiles } = authorIds.length ? await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', authorIds) : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    setComments((rows ?? []).map((row: any) => {
      const p: any = map.get(row.author_id);
      return { id: row.id, authorId: row.author_id, author: p?.display_name || p?.username || 'Driver', avatar: p?.avatar_url || null, body: row.body, createdAt: row.created_at };
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
    if (error) return Alert.alert('Editar publicação', error.message);
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

  async function share() {
    if (!post) return;
    await Share.share({ message: post.caption || 'Confira este projeto no StreetClub.' });
  }

  if (!post) return <Screen><View style={styles.center}><Text style={styles.muted}>Publicação não encontrada.</Text></View></Screen>;
  const mine = post.authorId === myUserId;
  const handle = post.authorUsername ? '@' + post.authorUsername : post.author;

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={22} color={theme.colors.text} /></Pressable>
          <Text style={styles.title}>Post</Text>
          <Pressable onPress={mine ? removePost : reportPost} style={styles.more}><Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text} /></Pressable>
        </View>

        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              <Pressable style={styles.authorRow} onPress={() => post.authorId && router.push('/user/' + post.authorId)}>
                <AppImage uri={post.authorAvatar} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{post.author[0]}</Text>} />
                <View style={styles.authorCopy}>
                  <Text style={styles.author}>{handle}</Text>
                  <Text style={styles.location}>{[post.authorCity, post.authorState].filter(Boolean).join(', ') || post.carName}</Text>
                </View>
              </Pressable>

              <AppImage uri={post.image} fallbackUri={linkedCar?.image} style={styles.image} placeholder={<Ionicons name="image-outline" size={42} color={theme.colors.muted2} />} />

              <View style={styles.actionRow}>
                <Pressable style={styles.action} onPress={() => { void togglePostLike(post.id); }}>
                  <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={25} color={post.liked ? theme.colors.accent : theme.colors.text} />
                  <Text style={styles.actionCount}>{post.likes}</Text>
                </Pressable>
                <View style={styles.action}><Ionicons name="chatbubble-outline" size={22} color={theme.colors.text} /><Text style={styles.actionCount}>{comments.length}</Text></View>
                <Pressable style={styles.action} onPress={() => { void share(); }}><Ionicons name="paper-plane-outline" size={22} color={theme.colors.text} /></Pressable>
                <Pressable style={[styles.action, styles.saveAction]} onPress={() => setSaved((value) => !value)}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={saved ? theme.colors.accent : theme.colors.text} /></Pressable>
              </View>

              <View style={styles.body}>
                {editing ? (
                  <>
                    <TextInput style={styles.captionInput} value={caption} onChangeText={setCaption} multiline />
                    <View style={styles.editActions}>
                      <Pressable onPress={() => setEditing(false)}><Text style={styles.cancel}>Cancelar</Text></Pressable>
                      <Pressable onPress={() => { void saveCaption(); }}><Text style={styles.save}>Salvar</Text></Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable onLongPress={() => mine && setEditing(true)}>
                    {!!post.caption && <Text style={styles.caption}><Text style={styles.captionAuthor}>{handle} </Text>{post.caption}</Text>}
                    {mine && <Text style={styles.hint}>Segure a legenda para editar</Text>}
                  </Pressable>
                )}
                <Text style={styles.tags}>#streetclub {post.carName ? '#' + post.carName.toLowerCase().replace(/\s+/g, '') : ''}</Text>
                <Text style={styles.commentsTitle}>Comentários</Text>
              </View>
            </View>
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable style={styles.comment} onPress={() => router.push('/user/' + item.authorId)}>
              <AppImage uri={item.avatar} style={styles.commentAvatar} placeholder={<Text style={styles.avatarText}>{item.author[0]}</Text>} />
              <View style={styles.commentCopy}>
                <Text style={styles.commentBody}><Text style={styles.commentAuthor}>{item.author} </Text>{item.body}</Text>
                <Text style={styles.commentTime}>{new Date(item.createdAt).toLocaleString('pt-BR')}</Text>
              </View>
            </Pressable>
          )}
        />

        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 9) }]}>
          <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Adicione um comentário..." placeholderTextColor={theme.colors.muted} multiline maxLength={1000} />
          <Pressable style={[styles.send, !text.trim() && styles.sendDisabled]} onPress={() => { void send(); }} disabled={!text.trim()}>
            <Ionicons name="paper-plane" size={19} color={theme.colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { color: theme.colors.text, fontSize: 14, fontWeight: '900', textAlign: 'center', flex: 1 },
  more: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  authorRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  avatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: '#4E1116' },
  avatarText: { color: theme.colors.text, fontWeight: '900' },
  authorCopy: { marginLeft: 9 },
  author: { color: theme.colors.text, fontWeight: '900', fontSize: 12.5 },
  location: { color: theme.colors.muted, fontSize: 9.5, marginTop: 2 },
  image: { width: '100%', aspectRatio: .92, backgroundColor: theme.colors.surface2 },
  actionRow: { height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: theme.colors.textSoft, fontSize: 10.5, fontWeight: '700' },
  saveAction: { marginLeft: 'auto' },
  body: { paddingHorizontal: 12, paddingBottom: 6 },
  caption: { color: theme.colors.textSoft, lineHeight: 18, fontSize: 12 },
  captionAuthor: { color: theme.colors.text, fontWeight: '900' },
  tags: { color: '#8290A9', fontSize: 10.5, marginTop: 5 },
  captionInput: { color: theme.colors.text, backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, padding: 11, minHeight: 78, textAlignVertical: 'top' },
  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18, marginTop: 8 },
  cancel: { color: theme.colors.muted, fontWeight: '800', fontSize: 10.5 },
  save: { color: theme.colors.accent, fontWeight: '900', fontSize: 10.5 },
  hint: { color: theme.colors.muted2, fontSize: 8.5, marginTop: 5 },
  commentsTitle: { color: theme.colors.text, fontWeight: '900', fontSize: 13.5, marginTop: 18, paddingBottom: 6 },
  list: { paddingBottom: 10 },
  comment: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 9 },
  commentAvatar: { width: 33, height: 33, borderRadius: 17 },
  commentCopy: { flex: 1 },
  commentBody: { color: theme.colors.textSoft, lineHeight: 17, fontSize: 11.5 },
  commentAuthor: { color: theme.colors.text, fontWeight: '900' },
  commentTime: { color: theme.colors.muted2, fontSize: 8, marginTop: 3 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, paddingHorizontal: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: theme.colors.border, backgroundColor: '#08090B' },
  input: { flex: 1, maxHeight: 105, minHeight: 42, color: theme.colors.text, backgroundColor: theme.colors.surface2, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 21, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12 },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendDisabled: { opacity: .4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { color: theme.colors.muted },
});
