import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

export default function FeedScreen() {
  const { posts, togglePostLike, isDemo } = useApp();
  return (
    <Screen>
      <View style={styles.header}><Text style={styles.logo}>APEX</Text><View style={styles.headerActions}><Text>🔔</Text><Text>💬</Text></View></View>
      {posts.length === 0 ? <View style={styles.empty}><Text style={styles.emptyIcon}>📸</Text><Text style={styles.emptyTitle}>Feed real pronto para receber posts</Text><Text style={styles.emptyText}>Nesta conta os dados demo estão escondidos. Publicações reais serão ligadas ao Supabase na próxima etapa.</Text></View> : <FlatList data={posts} keyExtractor={(item) => item.id} contentContainerStyle={styles.list} renderItem={({ item }) => (
        <View style={styles.post}><View style={styles.author}><View style={styles.avatar}><Text style={styles.avatarText}>{item.author[0]}</Text></View><View><Text style={styles.authorName}>{item.author}</Text><Text style={styles.carName}>{item.carName}</Text></View><Text style={styles.more}>•••</Text></View><Image source={{ uri: item.image }} style={styles.image}/><View style={styles.postBody}><View style={styles.actions}><Pressable onPress={() => togglePostLike(item.id)}><Text style={[styles.action, item.liked && { color: theme.colors.accent }]}>{item.liked ? '♥' : '♡'}</Text></Pressable><Text style={styles.action}>◯</Text><Text style={styles.action}>↗</Text><Text style={[styles.action, { marginLeft: 'auto' }]}>☆</Text></View><Text style={styles.likes}>{item.likes.toLocaleString('pt-BR')} curtidas</Text><Text style={styles.caption}><Text style={{ fontWeight: '900' }}>{item.author} </Text>{item.caption}</Text>{isDemo && <Text style={styles.demo}>conteúdo demo</Text>}</View></View>
      )}/>} 
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border }, logo: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: 4 }, headerActions: { marginLeft: 'auto', flexDirection: 'row', gap: 18 }, list: { paddingBottom: 26 }, post: { borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 18 }, author: { flexDirection: 'row', alignItems: 'center', padding: 14 }, avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: 'white', fontWeight: '900' }, authorName: { color: 'white', fontWeight: '900', marginLeft: 10 }, carName: { color: theme.colors.muted, marginLeft: 10, fontSize: 11, marginTop: 2 }, more: { marginLeft: 'auto', color: 'white' }, image: { width: '100%', aspectRatio: 1.12 }, postBody: { paddingHorizontal: 14 }, actions: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 16 }, action: { color: 'white', fontSize: 27 }, likes: { color: 'white', fontWeight: '900', marginTop: 5 }, caption: { color: '#E7E8EA', lineHeight: 20, marginTop: 6 }, demo: { color: '#F5C451', fontSize: 10, fontWeight: '900', marginTop: 8 }, empty: { margin: 18, padding: 28, backgroundColor: theme.colors.surface, borderRadius: 22, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' }, emptyIcon: { fontSize: 40 }, emptyTitle: { color: 'white', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 10 }, emptyText: { color: theme.colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 8 },
});
