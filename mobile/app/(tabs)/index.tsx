import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { usePlanStore } from '@/store/planStore';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/constants';

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { plans, load: loadPlans, toggle } = usePlanStore();

  useEffect(() => {
    loadPlans();
  }, []);

  const name = user?.email?.split('@')[0] ?? 'there';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const completed = plans.filter((p) => p.completed).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            {greeting}, {name} 🌸
          </Text>
          <Text style={styles.subGreeting}>How are you feeling today?</Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/(tabs)/mood')}
          >
            <Text style={styles.gridEmoji}>😊</Text>
            <Text style={styles.gridLabel}>Log Mood</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridCard, styles.gridCardPrimary]}
            onPress={() => router.push('/(tabs)/chat')}
          >
            <Text style={styles.gridEmoji}>💬</Text>
            <Text style={[styles.gridLabel, { color: colors.secondary }]}>
              Chat with AI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={styles.gridEmoji}>📋</Text>
            <Text style={styles.gridLabel}>
              {completed}/{plans.length} Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => router.push('/(tabs)/learn')}
          >
            <Text style={styles.gridEmoji}>📚</Text>
            <Text style={styles.gridLabel}>Read Today</Text>
          </TouchableOpacity>
        </View>

        {/* Recovery Plan */}
        <Card style={styles.planCard}>
          <Text style={styles.sectionTitle}>Today's Recovery Plan</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    plans.length ? (completed / plans.length) * 100 : 0
                  }%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {completed} of {plans.length} completed
          </Text>
          {plans.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.task}
              onPress={() => toggle(p.id, !p.completed)}
            >
              <Text style={styles.taskCheck}>
                {p.completed ? '☑️' : '⬜'}
              </Text>
              <Text
                style={[styles.taskText, p.completed && styles.taskDone]}
              >
                {p.title}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>
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
  header: { gap: 4 },
  greeting: {
    fontSize: 24,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
  },
  subGreeting: { fontSize: 15, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  gridCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.base,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#C47CA8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridCardPrimary: { backgroundColor: colors.lavenderLight },
  gridEmoji: { fontSize: 28 },
  gridLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500',
    textAlign: 'center',
  },
  planCard: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: { fontSize: 12, color: colors.textSecondary },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  taskCheck: { fontSize: 18 },
  taskText: { fontSize: 15, color: colors.textPrimary, flex: 1 },
  taskDone: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
});
