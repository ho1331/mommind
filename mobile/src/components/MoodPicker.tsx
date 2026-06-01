import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants';

export const MOODS = [
  { key: 'great', emoji: '😀', label: 'Great' },
  { key: 'okay', emoji: '🙂', label: 'Okay' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'sad', emoji: '😞', label: 'Sad' },
  { key: 'overwhelmed', emoji: '😫', label: 'Overwhelmed' },
] as const;

export type MoodKey = typeof MOODS[number]['key'];

interface Props {
  selected: MoodKey | null;
  onSelect: (mood: MoodKey) => void;
}

export function MoodPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {MOODS.map((m) => (
        <TouchableOpacity
          key={m.key}
          style={[styles.item, selected === m.key && styles.selected]}
          onPress={() => onSelect(m.key)}
          activeOpacity={0.7}
        >
          <Text style={styles.emoji}>{m.emoji}</Text>
          <Text style={[styles.label, selected === m.key && styles.labelSelected]}>{m.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  item: { alignItems: 'center', padding: spacing.sm, borderRadius: 12, flex: 1 },
  selected: { backgroundColor: colors.primarySurface },
  emoji: { fontSize: 28 },
  label: { fontSize: 10, color: colors.textSecondary, marginTop: 4 },
  labelSelected: { color: colors.primary, fontWeight: '600' },
});
