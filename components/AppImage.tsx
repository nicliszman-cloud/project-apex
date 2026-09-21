import { ReactNode, useMemo, useState } from 'react';
import { ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { resolveMediaUrl } from '@/lib/media';
import { theme } from '@/lib/theme';

type Props = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: ReactNode;
  accessibilityLabel?: string;
};

export function AppImage({
  uri,
  style,
  contentFit = 'cover',
  placeholder,
  accessibilityLabel,
}: Props) {
  const [failed, setFailed] = useState(false);
  const resolved = useMemo(() => resolveMediaUrl(uri), [uri]);

  if (!resolved || failed) {
    return (
      <View style={[styles.placeholder, style as StyleProp<ViewStyle>]}>
        {placeholder ?? <Text style={styles.icon}>🏎️</Text>}
      </View>
    );
  }

  return (
    <Image
      source={resolved}
      style={style}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={120}
      accessibilityLabel={accessibilityLabel}
      onError={() => setFailed(true)}
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
  icon: { fontSize: 34 },
});
