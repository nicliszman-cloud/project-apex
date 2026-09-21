import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { resolveMediaCandidates, resolveSignedMediaUrl } from '@/lib/media';
import { theme } from '@/lib/theme';

type Props = {
  uri?: string | null;
  fallbackUri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: ReactNode;
  accessibilityLabel?: string;
};

export function AppImage({
  uri,
  fallbackUri,
  style,
  contentFit = 'cover',
  placeholder,
  accessibilityLabel,
}: Props) {
  const candidates = useMemo(() => {
    const merged = [
      ...resolveMediaCandidates(uri),
      ...resolveMediaCandidates(fallbackUri),
    ];
    return [...new Set(merged)];
  }, [uri, fallbackUri]);

  const candidatesKey = candidates.join('|');
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [signedFallback, setSignedFallback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setCandidateIndex(0);
    setSignedFallback(null);

    async function prepareSignedFallback() {
      const primary = await resolveSignedMediaUrl(uri);
      if (!active) return;
      if (primary) {
        setSignedFallback(primary);
        return;
      }

      const fallback = await resolveSignedMediaUrl(fallbackUri);
      if (active && fallback) setSignedFallback(fallback);
    }

    void prepareSignedFallback();

    return () => {
      active = false;
    };
  }, [candidatesKey, uri, fallbackUri]);

  const allCandidates = signedFallback
    ? [...candidates, signedFallback].filter((value, index, array) => array.indexOf(value) === index)
    : candidates;

  const resolved = allCandidates[candidateIndex];

  if (!resolved) {
    return (
      <View style={[styles.placeholder, style as StyleProp<ViewStyle>]}>
        {placeholder ?? <Text style={styles.icon}>SC</Text>}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: resolved }}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={120}
      recyclingKey={resolved}
      accessibilityLabel={accessibilityLabel}
      onError={() => setCandidateIndex((current) => Math.min(current + 1, allCandidates.length))}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { color: theme.colors.muted2, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
});
