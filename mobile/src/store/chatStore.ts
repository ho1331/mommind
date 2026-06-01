import { create } from 'zustand';
import { api } from '@/services/api';
import * as Crypto from 'expo-crypto';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatState {
  sessionId: number | null;
  messages: Message[];
  isTyping: boolean;
  send: (content: string) => Promise<void>;
  loadSession: (sessionId: number) => Promise<void>;
  newSession: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessionId: null,
  messages: [],
  isTyping: false,

  newSession: () => set({ sessionId: null, messages: [] }),

  loadSession: async (sessionId) => {
    const { data } = await api.get(`/chat/sessions/${sessionId}/messages`);
    set({ sessionId, messages: data });
  },

  send: async (content) => {
    const client_id = Crypto.randomUUID();
    const optimistic: Message = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    set({ messages: [...get().messages, optimistic], isTyping: true });
    try {
      const { data } = await api.post('/chat', {
        content,
        session_id: get().sessionId,
        client_id,
      });
      set({
        sessionId: data.session_id,
        messages: [
          ...get().messages.filter((m) => m.id !== optimistic.id),
          data.user_message,
          data.assistant_message,
        ],
        isTyping: false,
      });
    } catch {
      set({
        messages: get().messages.filter((m) => m.id !== optimistic.id),
        isTyping: false,
      });
      throw new Error('Failed to send message');
    }
  },
}));
