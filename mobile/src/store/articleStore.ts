import { create } from 'zustand';
import { api } from '@/services/api';
import { getDb } from '@/db/index';

export interface Article {
  id: number;
  title: string;
  category: string;
  content: string;
  read_time_minutes: number;
}

interface ArticleState {
  articles: Article[];
  isLoading: boolean;
  load: () => Promise<void>;
}

type DbArticleRow = Article & { cached_at: string };

export const useArticleStore = create<ArticleState>((set) => ({
  articles: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const db = getDb();

    // 1. Load from SQLite
    const local = await db.getAllAsync<DbArticleRow>(
      'SELECT * FROM articles ORDER BY category, id'
    );
    if (local.length > 0) {
      set({ articles: local, isLoading: false });
      // Only refresh from server if cache is older than 24h
      const newest = local.reduce((a, b) => (a.cached_at > b.cached_at ? a : b));
      const ageMs = Date.now() - new Date(newest.cached_at).getTime();
      if (ageMs < 24 * 60 * 60 * 1000) return;
    }
    // If SQLite empty, keep isLoading:true until server responds

    // 2. Fetch from server
    try {
      const { data } = await api.get('/articles');
      const now = new Date().toISOString();
      await db.runAsync('DELETE FROM articles');
      for (const a of data) {
        await db.runAsync(
          'INSERT INTO articles (id, title, category, content, read_time_minutes, cached_at) VALUES (?, ?, ?, ?, ?, ?)',
          [a.id, a.title, a.category, a.content, a.read_time_minutes, now]
        );
      }
      set({ articles: data, isLoading: false });
    } catch {
      // Offline with empty cache — show error state
      set({ isLoading: false });
    }
  },
}));
