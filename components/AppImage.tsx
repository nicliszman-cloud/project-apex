import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { resolveMediaCandidates } from '@/lib/media';
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

  useEffect(() => {
    setCandidateIndex(0);
  }, [candidatesKey]);

  const resolved = candidates[candidateIndex];

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
      onError={() => setCandidateIndex((current) => current + 1)}
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
