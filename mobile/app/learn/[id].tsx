import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useArticleStore, Article } from '@/store/articleStore';
import { colors, spacing } from '@/constants';

export default function ArticleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { articles, load } = useArticleStore();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const findArticle = async () => {
      // Try from already-loaded store first
      let found = articles.find((a) => a.id === Number(id));
      if (!found) {
        // Trigger a load if store is empty
        await load();
        found = useArticleStore.getState().articles.find((a) => a.id === Number(id));
      }
      setArticle(found ?? null);
      setLoading(false);
    };
    findArticle();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.loading}>
        <Text style={styles.errorText}>Article not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.category}>{article.category}</Text>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.meta}>⏱ {article.read_time_minutes} min read</Text>
        <Text style={styles.content}>{article.content}</Text>
      </ScrollView>
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
  },
  errorText: { color: colors.textSecondary, fontSize: 15 },
  back: { padding: spacing.base },
  backText: { color: colors.primary, fontSize: 16, fontWeight: '600' },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.base,
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    lineHeight: 36,
  },
  meta: { fontSize: 13, color: colors.textSecondary },
  content: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
  },
});
