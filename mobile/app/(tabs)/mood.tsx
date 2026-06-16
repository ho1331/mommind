import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useMoodStore } from '@/store/moodStore';
import { MoodPicker, MoodKey, MOODS } from '@/components/MoodPicker';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors, spacing, radius } from '@/constants';

export default function MoodScreen() {
  const [selected, setSelected] = useState<MoodKey | null>(null);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const { entries, load, add, isLoading } = useMoodStore();

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!selected) {
      Alert.alert('Select a mood', 'Please tap one of the emojis above.');
      return;
    }
    try {
      await add(selected, note.trim() || undefined);
      setSaved(true);
      setNote('');
      setSelected(null);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      Alert.alert('Error', 'Could not save your mood. Please try again.');
    }
  };

  const last7 = entries.slice(0, 7).reverse();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Mood Check-in</Text>
        <Text style={styles.subtitle}>How are you feeling right now?</Text>

        <Card>
          <MoodPicker selected={selected} onSelect={setSelected} />
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)..."
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={200}
          />
          <Button
            title={saved ? '✓ Saved!' : 'Save Check-in'}
            onPress={save}
            loading={isLoading}
          />
        </Card>

        {last7.length > 0 && (
          <Card style={styles.weekCard}>
            <Text style={styles.sectionTitle}>This Week</Text>
            <View style={styles.weekRow}>
              {last7.map((e) => {
                const mood = MOODS.find((m) => m.key === e.mood);
                const d = new Date(e.created_at);
                const day = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][
                  d.getDay()
                ];
                return (
                  <View key={e.id} style={styles.dayItem}>
                    <Text style={styles.dayEmoji}>{mood?.emoji ?? '❓'}</Text>
                    <Text style={styles.dayLabel}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
        )}

        {entries.length > 0 && (
          <Card>
            <Text style={styles.sectionTitle}>Recent</Text>
            {entries.slice(0, 5).map((e) => {
              const mood = MOODS.find((m) => m.key === e.mood);
              return (
                <View key={e.id} style={styles.entryRow}>
                  <Text style={styles.entryEmoji}>{mood?.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryMood}>{mood?.label}</Text>
                    {e.note ? (
                      <Text style={styles.entryNote}>{e.note}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.entryDate}>
                    {new Date(e.created_at).toLocaleDateString()}
                  </Text>
                </View>
              );
            })}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.base,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
  },
  subtitle: { fontSize: 15, color: colors.textSecondary },
  noteInput: {
    borderRadius: radius.md,
    padding: 12,
    backgroundColor: colors.background,
    fontSize: 14,
    color: colors.textPrimary,
    marginVertical: spacing.base,
    minHeight: 60,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekCard: {},
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: spacing.sm,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  dayItem: { alignItems: 'center', gap: spacing.xs },
  dayEmoji: { fontSize: 22 },
  dayLabel: { fontSize: 11, color: colors.textSecondary },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  entryEmoji: { fontSize: 24 },
  entryMood: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  entryNote: { fontSize: 13, color: colors.textSecondary },
  entryDate: { fontSize: 11, color: colors.textSecondary },
});
