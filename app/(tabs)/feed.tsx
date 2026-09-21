import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppImage } from '@/components/AppImage';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function FeedScreen() {
  const { posts, togglePostLike, isDemo } = useApp();

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.logo}>APEX</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')}><Text style={styles.headerIcon}>🔔</Text></Pressable>
          <Pressable onPress={() => router.push('/inbox')}><Text style={styles.headerIcon}>💬</Text></Pressable>
        </View>
      </View>

      {posts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📸</Text>
          <Text style={styles.emptyTitle}>Seu feed real está vazio</Text>
          <Text style={styles.emptyText}>Use o botão ＋ e escolha Post para publicar a primeira foto.</Text>
          <Pressable style={styles.createButton} onPress={() => router.push('/(tabs)/create')}><Text style={styles.createText}>Criar post</Text></Pressable>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.post}>
              <Pressable style={styles.author} onPress={() => item.authorId && router.push('/user/' + item.authorId)}>
                <AppImage uri={item.authorAvatar} style={styles.avatar} placeholder={<Text style={styles.avatarText}>{item.author[0]}</Text>} />
                <View><Text style={styles.authorName}>{item.author}</Text><Text style={styles.carName}>{item.carName}</Text></View>
                <Text style={styles.more}>•••</Text>
              </Pressable>

              <Pressable onPress={() => router.push('/post/' + item.id)}>
                <AppImage uri={item.image} style={styles.image} placeholder={<Text style={styles.photoPlaceholder}>📸</Text>} />
              </Pressable>

              <View style={styles.postBody}>
                <View style={styles.actions}>
                  <Pressable onPress={() => { void togglePostLike(item.id); }}><Text style={[styles.action, item.liked && { color: theme.colors.accent }]}>{item.liked ? '♥' : '♡'}</Text></Pressable>
                  <Pressable onPress={() => router.push('/post/' + item.id)}><Text style={styles.action}>◯</Text></Pressable>
                  <Text style={styles.action}>↗</Text>
                  <Text style={[styles.action, { marginLeft: 'auto' }]}>☆</Text>
                </View>
                <Text style={styles.likes}>{item.likes.toLocaleString('pt-BR')} curtidas</Text>
                <Pressable onPress={() => router.push('/post/' + item.id)}>
                  <Text style={styles.caption}><Text style={{ fontWeight: '900' }}>{item.author} </Text>{item.caption}</Text>
                  <Text style={styles.commentsLink}>Ver comentários</Text>
                </Pressable>
                {isDemo && <Text style={styles.demo}>conteúdo demo</Text>}
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  logo: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  headerActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 18 },
  headerIcon: { fontSize: 19 },
  list: { paddingBottom: 26 },
  post: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 18 },
  author: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  avatar: { width: 38, height: 38, borderRadius: 19 },
  avatarText: { color: 'white', fontWeight: '900' },
  authorName: { color: 'white', fontWeight: '900', marginLeft: 10 },
  carName: { color: theme.colors.muted, marginLeft: 10, fontSize: 11, marginTop: 2 },
  more: { marginLeft: 'auto', color: 'white' },
  image: { width: '100%', aspectRatio: 1.12 },
  photoPlaceholder: { fontSize: 42 },
  postBody: { paddingHorizontal: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 16 },
  action: { color: 'white', fontSize: 27 },
  likes: { color: 'white', fontWeight: '900', marginTop: 5 },
  caption: { color: '#E7E8EA', lineHeight: 20, marginTop: 6 },
  commentsLink: { color: theme.colors.muted, fontSize: 11, marginTop: 6 },
  demo: { color: '#F5C451', fontSize: 10, fontWeight: '900', marginTop: 8 },
  empty: { margin: 18, padding: 28, backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
  createButton: { backgroundColor: theme.colors.accent, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, marginTop: 16 },
  createText: { color: 'white', fontWeight: '900' },
});
