import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { theme } from '@/lib/theme';

export function FormField({
  label,
  multiline,
  containerStyle,
  ...props
}: TextInputProps & { label: string; containerStyle?: StyleProp<ViewStyle> }) {
  return (
    <View style={containerStyle}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={theme.colors.muted2}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multiline, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: theme.colors.textSoft, fontSize: 11, fontWeight: '800', marginTop: 16, marginBottom: 7 },
  input: { minHeight: 46, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, color: theme.colors.text, paddingHorizontal: 13, fontSize: 12.5 },
  multiline: { minHeight: 108, paddingTop: 12 },
});
