import Ionicons from '@expo/vector-icons/Ionicons';
import { Share, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppImage } from '@/components/AppImage';
import { theme } from '@/lib/theme';
import { Car, FeedPost } from '@/types';

export function SocialPostCard({
  post,
  car,
  saved,
  onToggleLike,
  onToggleSave,
}: {
  post: FeedPost;
  car?: Car;
  saved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
}) {
  const location = [post.authorCity || car?.city, post.authorState || car?.state].filter(Boolean).join(', ');
  const handle = post.authorUsername ? '@' + post.authorUsername : post.author;
  const tags = car
    ? ['#' + car.category.toLowerCase().replace(/\s+/g, ''), '#' + car.make.toLowerCase().replace(/\s+/g, ''), '#streetclub']
    : ['#streetclub'];

  async function sharePost() {
    await Share.share({
      message: post.caption
        ? post.caption + '\n\n' + tags.join(' ')
        : 'Confira este projeto no StreetClub.\n\n' + tags.join(' '),
    });
  }

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.authorRow}
        onPress={() => post.authorId && router.push('/user/' + post.authorId)}
      >
        <AppImage
          uri={post.authorAvatar}
          style={styles.avatar}
          placeholder={<Text style={styles.avatarLetter}>{post.author.slice(0, 1).toUpperCase()}</Text>}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.handle} numberOfLines={1}>{handle}</Text>
          <Text style={styles.location} numberOfLines={1}>
            {location || post.carName || 'StreetClub'}
          </Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.muted} />
      </Pressable>

      <Pressable onPress={() => router.push('/post/' + post.id)}>
        <AppImage
          uri={post.image}
          fallbackUri={car?.image}
          style={styles.image}
          placeholder={<Ionicons name="image-outline" size={42} color={theme.colors.muted2} />}
          accessibilityLabel={'Foto publicada por ' + post.author}
        />
      </Pressable>

      <View style={styles.actions}>
        <Pressable hitSlop={8} onPress={onToggleLike} style={styles.actionButton}>
          <Ionicons
            name={post.liked ? 'heart' : 'heart-outline'}
            size={25}
            color={post.liked ? theme.colors.accent : theme.colors.text}
          />
          <Text style={styles.actionCount}>{post.likes.toLocaleString('pt-BR')}</Text>
        </Pressable>

        <Pressable hitSlop={8} onPress={() => router.push('/post/' + post.id)} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.text} />
          {!!post.comments && <Text style={styles.actionCount}>{post.comments}</Text>}
        </Pressable>

        <Pressable hitSlop={8} onPress={() => { void sharePost(); }} style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={23} color={theme.colors.text} />
        </Pressable>

        <Pressable hitSlop={8} onPress={onToggleSave} style={[styles.actionButton, styles.saveButton]}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={23} color={saved ? theme.colors.accent : theme.colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        {!!post.caption && (
          <Pressable onPress={() => router.push('/post/' + post.id)}>
            <Text style={styles.caption}>
              <Text style={styles.captionAuthor}>{handle} </Text>
              {post.caption}
            </Text>
          </Pressable>
        )}
        <Text style={styles.tags}>{tags.join(' ')}</Text>
        {!!post.comments && (
          <Pressable onPress={() => router.push('/post/' + post.id)}>
            <Text style={styles.comments}>Ver todos os {post.comments} comentários</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  authorRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#4B1116',
  },
  avatarLetter: { color: theme.colors.text, fontWeight: '900' },
  authorInfo: { flex: 1, marginLeft: 10 },
  handle: { color: theme.colors.text, fontSize: 13, fontWeight: '900' },
  location: { color: theme.colors.muted, fontSize: 10, marginTop: 2 },
  image: { width: '100%', aspectRatio: 1.04, backgroundColor: theme.colors.surface2 },
  actions: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    gap: 17,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionCount: { color: theme.colors.textSoft, fontSize: 11, fontWeight: '700' },
  saveButton: { marginLeft: 'auto' },
  body: { paddingHorizontal: 12, paddingBottom: 14 },
  caption: { color: theme.colors.textSoft, fontSize: 12.5, lineHeight: 18 },
  captionAuthor: { color: theme.colors.text, fontWeight: '900' },
  tags: { color: '#8290A9', fontSize: 11.5, marginTop: 5, lineHeight: 17 },
  comments: { color: theme.colors.muted, fontSize: 11, marginTop: 7 },
});
