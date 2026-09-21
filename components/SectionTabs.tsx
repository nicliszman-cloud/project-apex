import { Pressable, ScrollView, StyleSheet, Text, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

export function SectionTabs<T extends string>({
  items,
  value,
  onChange,
  compact = false,
  style,
}: {
  items: readonly T[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  style?: ViewStyle;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, style]}>
      {items.map((item) => {
        const active = value === item;
        return (
          <Pressable key={item} onPress={() => onChange(item)} style={[styles.item, compact && styles.compact, active && styles.active]}>
            <Text style={[styles.text, active && styles.textActive]}>{item}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles=StyleSheet.create({
  row:{gap:8,paddingHorizontal:14},
  item:{minHeight:36,paddingHorizontal:14,borderRadius:18,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center',backgroundColor:theme.colors.surface},
  compact:{minHeight:32,paddingHorizontal:12},
  active:{borderColor:theme.colors.accent,backgroundColor:'#25080B'},
  text:{color:theme.colors.muted,fontSize:11,fontWeight:'800'},
  textActive:{color:theme.colors.text},
});
