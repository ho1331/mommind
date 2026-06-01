import { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { colors, spacing } from '@/constants';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  label: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  value: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
  },
});

const PLAN_LABELS: Record<string, string> = {
  trial: '🎁 Free Trial',
  active: '⭐ Active',
  expired: '❌ Expired',
};

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { subscription, load } = useSubscriptionStore();

  useEffect(() => {
    load();
  }, []);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>

        {/* Profile info */}
        <Card>
          <Text style={styles.sectionTitle}>My Profile</Text>
          {user?.child_age_group ? (
            <Row label="Child's age" value={user.child_age_group} />
          ) : null}
          {user?.primary_challenge ? (
            <Row label="My challenge" value={user.primary_challenge} />
          ) : null}
          {user?.goals?.length ? (
            <Row label="My goals" value={user.goals.join(', ')} />
          ) : null}
          {!user?.child_age_group && !user?.primary_challenge && !user?.goals?.length ? (
            <Text style={styles.emptyProfile}>
              Complete onboarding to see your profile here.
            </Text>
          ) : null}
        </Card>

        {/* Subscription */}
        <Card>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <Row
            label="Status"
            value={
              subscription
                ? PLAN_LABELS[subscription.plan] ?? subscription.plan
                : 'No active subscription'
            }
          />
          {subscription?.expires_at ? (
            <Row
              label="Expires"
              value={new Date(subscription.expires_at).toLocaleDateString()}
            />
          ) : null}
          {(!subscription || subscription.plan === 'expired') && (
            <Button
              title="Upgrade to Premium"
              onPress={() => router.push('/paywall')}
              variant="secondary"
              style={{ marginTop: spacing.sm }}
            />
          )}
        </Card>

        {/* Logout */}
        <Button title="Log Out" onPress={handleLogout} variant="ghost" />
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
  avatarContainer: { alignItems: 'center', gap: 8, paddingTop: spacing.sm },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lavenderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 36 },
  email: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Georgia',
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  emptyProfile: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingTop: spacing.sm,
    fontStyle: 'italic',
  },
});
