import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants';

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function SuggestedReplies({ suggestions, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.content}>
      {suggestions.map((s) => (
        <TouchableOpacity key={s} style={styles.chip} onPress={() => onSelect(s)}>
          <Text style={styles.text}>{s}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexShrink: 0,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  content: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: { color: colors.primary, fontSize: 13, fontWeight: '600' },
});
