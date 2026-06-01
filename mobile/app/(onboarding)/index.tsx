import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants';

const AGE_GROUPS = ['0–6 months', '6–12 months', '1–2 years', '2–4 years'];
const CHALLENGES = ['Anxiety', 'Exhaustion', 'Loneliness', 'Guilt', 'Stress'];
const GOALS = [
  'Feel emotionally better',
  'Reduce anxiety',
  'Build healthy habits',
  'Get support',
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [ageGroup, setAgeGroup] = useState('');
  const [challenge, setChallenge] = useState('');
  const [goals, setGoals] = useState<string[]>([]);

  const toggleGoal = (g: string) =>
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  const next = async () => {
    if (step < 4) {
      setStep((s) => s + 1);
      return;
    }
    await AsyncStorage.setItem('onboarding_done', '1');
    await AsyncStorage.setItem(
      'onboarding_data',
      JSON.stringify({ ageGroup, challenge, goals })
    );
    router.replace('/(auth)/register');
  };

  const dots = Array.from({ length: 5 }, (_, i) => i);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress dots */}
        <View style={styles.dots}>
          {dots.map((i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        {step === 0 && (
          <View style={styles.center}>
            <Text style={styles.bigEmoji}>🌸</Text>
            <Text style={styles.title}>Welcome to{'\n'}MomMind AI</Text>
            <Text style={styles.subtitle}>
              A supportive companion for your motherhood journey.
            </Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.title}>How old is your child?</Text>
            {AGE_GROUPS.map((ag) => (
              <TouchableOpacity
                key={ag}
                style={[styles.option, ageGroup === ag && styles.optionSelected]}
                onPress={() => setAgeGroup(ag)}
              >
                <Text
                  style={[
                    styles.optionText,
                    ageGroup === ag && styles.optionTextSelected,
                  ]}
                >
                  {ag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.title}>What's your biggest challenge?</Text>
            {CHALLENGES.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.option, challenge === c && styles.optionSelected]}
                onPress={() => setChallenge(c)}
              >
                <Text
                  style={[
                    styles.optionText,
                    challenge === c && styles.optionTextSelected,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.title}>What are your goals?</Text>
            <Text style={styles.subtitle}>Select all that apply</Text>
            {GOALS.map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.option,
                  goals.includes(g) && styles.optionSelected,
                ]}
                onPress={() => toggleGoal(g)}
              >
                <Text
                  style={[
                    styles.optionText,
                    goals.includes(g) && styles.optionTextSelected,
                  ]}
                >
                  {goals.includes(g) ? '✓  ' : ''}
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 4 && (
          <View style={styles.section}>
            <Text style={styles.bigEmoji}>✨</Text>
            <Text style={styles.title}>Your personalized{'\n'}experience is ready</Text>
            <View style={styles.summaryCard}>
              {ageGroup ? (
                <Text style={styles.summaryItem}>👶 Child: {ageGroup}</Text>
              ) : null}
              {challenge ? (
                <Text style={styles.summaryItem}>💙 Challenge: {challenge}</Text>
              ) : null}
              {goals.length > 0 ? (
                <Text style={styles.summaryItem}>
                  🎯 Goals: {goals.join(', ')}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <View style={styles.bottomActions}>
          <Button
            title={step === 4 ? 'Get Started' : 'Continue'}
            onPress={next}
          />
          {step === 0 && (
            <TouchableOpacity onPress={next}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 20 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    minHeight: 300,
  },
  section: { gap: 12, minHeight: 300 },
  bigEmoji: { fontSize: 64, textAlign: 'center' },
  title: {
    fontSize: 26,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  option: {
    padding: spacing.base,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  optionText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  optionTextSelected: { color: colors.secondary, fontWeight: '600' },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.base,
    gap: 10,
  },
  summaryItem: { fontSize: 15, color: colors.textPrimary },
  bottomActions: { gap: spacing.sm, marginTop: spacing.xl },
  skip: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
});
