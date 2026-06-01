import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants';

const BENEFITS = [
  { emoji: '💬', text: 'Unlimited AI conversations' },
  { emoji: '📋', text: 'Personalized recovery plans' },
  { emoji: '📊', text: 'Mood insights & trends' },
  { emoji: '📚', text: 'Premium educational content' },
];

export default function Paywall() {
  const { activate } = useSubscriptionStore();
  const { user } = useAuthStore();
  const isMock = user?.email?.startsWith('mmm+') ?? false;

  const startTrial = async () => {
    try {
      await activate();
    } catch {
      // if activation fails (e.g. no token yet), still navigate
    }
    router.replace('/(tabs)/');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {isMock && (
          <View style={styles.mockBadge}>
            <Text style={styles.mockBadgeText}>QA MODE — no real charge</Text>
          </View>
        )}
        <View style={styles.top}>
          <Text style={styles.emoji}>🌸</Text>
          <Text style={styles.title}>
            Start Your Emotional{'\n'}Recovery Journey
          </Text>
          <Text style={styles.subtitle}>
            Everything you need to feel better, all in one place.
          </Text>
        </View>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefit}>
              <Text style={styles.benefitEmoji}>{b.emoji}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceCard}>
          <Text style={styles.trial}>3 days FREE</Text>
          <Text style={styles.price}>then $9.99/month</Text>
          <Text style={styles.cancel}>Cancel anytime</Text>
        </View>

        <Button title="Start Free Trial" onPress={startTrial} />

        <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
          <Text style={styles.skip}>Maybe Later</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  top: { alignItems: 'center', gap: 12, paddingTop: spacing.xl },
  emoji: { fontSize: 64 },
  title: {
    fontSize: 28,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  benefits: { gap: 12 },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    padding: spacing.base,
    borderRadius: 12,
  },
  benefitEmoji: { fontSize: 24 },
  benefitText: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  priceCard: {
    backgroundColor: colors.lavenderLight,
    borderRadius: 16,
    padding: spacing.base,
    alignItems: 'center',
    gap: 4,
  },
  trial: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  price: { fontSize: 15, color: colors.textSecondary },
  cancel: { fontSize: 12, color: colors.textSecondary },
  skip: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },
  mockBadge: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  mockBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    letterSpacing: 0.5,
  },
});
