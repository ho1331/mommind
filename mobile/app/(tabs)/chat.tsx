import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ListRenderItem,
} from 'react-native';
import { useChatStore } from '@/store/chatStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useIsOffline } from '@/services/api';
import { TypingIndicator } from '@/components/TypingIndicator';
import { SuggestedReplies } from '@/components/SuggestedReplies';
import { colors, spacing } from '@/constants';
import { router } from 'expo-router';

const SUGGESTIONS_FIRST = [
  "I'm feeling overwhelmed",
  "I can't stop crying",
  'I feel so lonely',
  'I need some support',
];
const SUGGESTIONS_FOLLOWUP = [
  'Tell me more',
  'What can I do right now?',
  'That helps, thank you',
  "I'm still struggling",
];

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const { messages, isTyping, send, newSession } = useChatStore();
  const { subscription } = useSubscriptionStore();
  const isOffline = useIsOffline();

  const isSubscribed = subscription?.plan === 'trial' || subscription?.plan === 'active';
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    newSession();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isTyping]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isOffline) return;
    setText('');
    try {
      await send(content.trim());
    } catch {
      Alert.alert(
        'Connection Error',
        'Could not reach the AI. Please check your internet connection.'
      );
    }
  };

  const lastRole = messages[messages.length - 1]?.role;
  const suggestions =
    messages.length === 0
      ? SUGGESTIONS_FIRST
      : lastRole === 'assistant'
      ? SUGGESTIONS_FOLLOWUP
      : [];

  const renderMessage: ListRenderItem<Message> = ({ item: m }) => (
    <View style={[styles.bubbleRow, m.role === 'user' && styles.userRow]}>
      {m.role === 'assistant' && (
        <Text style={styles.aiAvatar}>🌸</Text>
      )}
      <View
        style={[
          styles.bubble,
          m.role === 'user' ? styles.userBubble : styles.aiBubble,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            m.role === 'user' && styles.userBubbleText,
          ]}
        >
          {m.content}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Subscription gate */}
      {!isSubscribed && (
        <View style={styles.gate}>
          <Text style={styles.gateEmoji}>🔒</Text>
          <Text style={styles.gateTitle}>Chat is unavailable</Text>
          <Text style={styles.gateText}>
            {subscription?.plan === 'expired'
              ? 'Your subscription has expired.\nRenew to continue talking with MomMind AI.'
              : 'Start your free trial to talk\nwith MomMind AI.'}
          </Text>
          <TouchableOpacity style={styles.gateBtn} onPress={() => router.push('/paywall')}>
            <Text style={styles.gateBtnText}>
              {subscription?.plan === 'expired' ? 'Renew Subscription' : 'Start Free Trial'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Offline banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You're offline — chat is unavailable</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>🌸</Text>
        </View>
        <View>
          <Text style={styles.name}>MomMind AI</Text>
          <Text style={styles.status}>Here for you, always</Text>
        </View>
      </View>

      {isSubscribed && <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Empty state */}
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>💙</Text>
            <Text style={styles.emptyText}>
              I'm here to listen.{'\n'}What's on your mind today?
            </Text>
          </View>
        )}

        <FlatList
          ref={listRef}
          data={messages as Message[]}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={renderMessage}
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
        />

        {/* Suggested replies */}
        {suggestions.length > 0 && !isTyping && (
          <SuggestedReplies suggestions={suggestions} onSelect={handleSend} />
        )}

        {/* Input bar */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={() => handleSend(text)}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!text.trim() || isTyping) && styles.sendBtnDisabled,
            ]}
            onPress={() => handleSend(text)}
            disabled={!text.trim() || isTyping || isOffline}
          >
            <Text style={styles.sendIcon}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.base,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.lavenderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 24 },
  name: { fontSize: 16, fontWeight: '700', color: colors.secondary },
  status: { fontSize: 12, color: colors.success },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: 12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  messageList: {
    padding: spacing.base,
    gap: 12,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  bubbleRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  userRow: { justifyContent: 'flex-end' },
  aiAvatar: { fontSize: 20, marginBottom: 2 },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: colors.primaryLight,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  userBubbleText: { color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  gate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: 12,
  },
  gateEmoji: { fontSize: 52 },
  gateTitle: {
    fontSize: 20,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    textAlign: 'center',
  },
  gateText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  gateBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  gateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  offlineBanner: {
    backgroundColor: '#FFF3CD',
    borderBottomWidth: 1,
    borderBottomColor: '#FFC107',
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
  },
  offlineText: { fontSize: 13, color: '#856404', fontWeight: '500' },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
