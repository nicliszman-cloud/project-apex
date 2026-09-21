import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { BrandLogo } from '@/components/BrandLogo';
import { SearchBar } from '@/components/SearchBar';
import { IconButton } from '@/components/IconButton';
import { FeedEmptyState } from '@/components/FeedEmptyState';
import { SocialPostCard } from '@/components/SocialPostCard';
import { useApp } from '@/context/AppContext';
import { theme } from '@/lib/theme';

const categories = ['Para você', 'JDM', 'Euro', 'Muscle', 'Clássicos'] as const;
type HomeCategory = typeof categories[number];

export default function FeedScreen() {
  const { posts, cars, togglePostLike, refreshRemoteData } = useApp();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<HomeCategory>('Para você');
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshRemoteData();
    }, [refreshRemoteData])
  );

  const carsById = useMemo(() => new Map(cars.map((car) => [car.id, car])), [cars]);

  const visiblePosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const car = post.carId ? carsById.get(post.carId) : undefined;
      const matchesSearch = !q || [
        post.author,
        post.authorUsername,
        post.caption,
        post.carName,
        car?.make,
        car?.model,
      ].filter(Boolean).join(' ').toLowerCase().includes(q);

      let matchesCategory = true;
      if (category === 'JDM' || category === 'Euro' || category === 'Muscle') {
        matchesCategory = car?.category === category;
      } else if (category === 'Clássicos') {
        matchesCategory = Boolean(car && car.year > 0 && car.year <= 1999);
      }

      return matchesSearch && matchesCategory;
    });
  }, [posts, carsById, query, category]);

  async function refresh() {
    setRefreshing(true);
    try {
      await refreshRemoteData();
    } finally {
      setRefreshing(false);
    }
  }

  function toggleSaved(postId: string) {
    setSavedIds((current) => current.includes(postId)
      ? current.filter((id) => id !== postId)
      : [...current, postId]);
  }

  const listHeader = (
    <View>
      <View style={styles.topbar}>
        <BrandLogo size={27} />
        <View style={styles.topActions}>
          <IconButton
            name="notifications-outline"
            accessibilityLabel="Notificações"
            onPress={() => router.push('/notifications')}
          />
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar carros, projetos, usuários..."
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categories}
      >
        {categories.map((item) => {
          const active = item === category;
          return (
            <Pressable key={item} onPress={() => setCategory(item)} style={styles.category}>
              <View style={[styles.categoryMark, active && styles.categoryMarkActive]}>
                <Ionicons
                  name={item === 'Para você' ? 'flash-outline' : 'car-sport-outline'}
                  size={20}
                  color={active ? theme.colors.white : theme.colors.muted}
                />
              </View>
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Na rua agora</Text>
        <Pressable onPress={() => router.push('/(tabs)/discover')}>
          <Text style={styles.sectionLink}>Explorar</Text>
        </Pressable>
      </View>
    </View>
  );

  if (posts.length === 0 && !query) {
    return (
      <Screen>
        {listHeader}
        <FeedEmptyState onCreate={() => router.push('/(tabs)/create')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { void refresh(); }} tintColor={theme.colors.accent} />}
        renderItem={({ item }) => (
          <SocialPostCard
            post={item}
            car={item.carId ? carsById.get(item.carId) : undefined}
            saved={savedIds.includes(item.id)}
            onToggleLike={() => { void togglePostLike(item.id); }}
            onToggleSave={() => toggleSaved(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={32} color={theme.colors.muted2} />
            <Text style={styles.noResultsTitle}>Nada encontrado</Text>
            <Text style={styles.noResultsText}>Tente outra busca ou categoria.</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 22 },
  topbar: {
    minHeight: 58,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topActions: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' },
  searchWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  categories: { paddingHorizontal: 14, gap: 17, paddingBottom: 16 },
  category: { alignItems: 'center', minWidth: 58 },
  categoryMark: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryMarkActive: {
    backgroundColor: '#1B080A',
    borderColor: theme.colors.accent,
  },
  categoryText: { color: theme.colors.muted, fontSize: 10.5, marginTop: 6, fontWeight: '700' },
  categoryTextActive: { color: theme.colors.text, fontWeight: '900' },
  sectionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '900' },
  sectionLink: { color: theme.colors.accent, fontSize: 11, fontWeight: '900', marginLeft: 'auto' },
  noResults: { margin: 18, padding: 32, alignItems: 'center' },
  noResultsTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', marginTop: 12 },
  noResultsText: { color: theme.colors.muted, marginTop: 5 },
});
