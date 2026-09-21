import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { resolveMediaCandidates, resolveRemoteImageForDisplay, resolveSignedMediaUrl } from '@/lib/media';
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
  const [remoteFallback, setRemoteFallback] = useState<string | null>(null);
  const [probingRemote, setProbingRemote] = useState(false);

  useEffect(() => {
    let active = true;
    setCandidateIndex(0);
    setSignedFallback(null);
    setRemoteFallback(null);
    setProbingRemote(false);

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

  const allCandidates = [...candidates, signedFallback, remoteFallback]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index);

  const resolved = allCandidates[candidateIndex];

  async function handleError() {
    if (candidateIndex + 1 < allCandidates.length) {
      setCandidateIndex((current) => current + 1);
      return;
    }

    if (probingRemote) {
      setCandidateIndex(allCandidates.length);
      return;
    }

    setProbingRemote(true);
    const remote = await resolveRemoteImageForDisplay(uri)
      || await resolveRemoteImageForDisplay(fallbackUri);

    if (remote && !allCandidates.includes(remote)) {
      setRemoteFallback(remote);
      setCandidateIndex(allCandidates.length);
      return;
    }

    setCandidateIndex(allCandidates.length);
  }

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
      accessibilityLabel={accessibilityLabel}
      onError={() => { void handleError(); }}
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
