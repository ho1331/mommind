import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '@/services/api';
import { Card } from '@/components/Card';
import { colors, spacing } from '@/constants';

interface ArticleItem {
  id: number;
  title: string;
  category: string;
  read_time_minutes: number;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  'Postpartum Emotions': '💙',
  'Managing Anxiety': '🌬️',
  'Self-Care': '🌸',
  'Sleep & Mood': '😴',
  'Building Support Systems': '🤝',
};

export default function LearnScreen() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get('/articles')
      .then((r) => setArticles(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const grouped = articles.reduce<Record<string, ArticleItem[]>>((acc, a) => {
    acc[a.category] = acc[a.category] || [];
    acc[a.category].push(a);
    return acc;
  }, {});

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>
          Could not load articles.{'\n'}Please check your connection.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([cat]) => cat}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <Text style={styles.title}>Learning Center</Text>
        }
        renderItem={({ item: [category, items] }) => (
          <View style={styles.section}>
            <Text style={styles.category}>
              {CATEGORY_EMOJIS[category] ?? '📖'} {category}
            </Text>
            {items.map((a) => (
              <TouchableOpacity
                key={a.id}
                onPress={() => router.push(`/learn/${a.id}`)}
                activeOpacity={0.7}
              >
                <Card style={styles.articleCard}>
                  <Text style={styles.articleTitle}>{a.title}</Text>
                  <Text style={styles.readTime}>
                    ⏱ {a.read_time_minutes} min read
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorText: {
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: spacing.sm,
  },
  section: { gap: spacing.sm },
  category: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  articleCard: { gap: 6 },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 22,
  },
  readTime: { fontSize: 12, color: colors.textSecondary },
});
