// /mobile/screens/notifications/NotificationsScreen.tsx
// The inbox. Tapping a row marks it read and deep-links to the thing it's about.

import React, { useCallback, useEffect } from 'react';
import { FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing, type, elevation } from '../../theme/theme';
import { EmptyState, ScreenHeader } from '../../components';
import { useNotifications } from '../../context/NotificationsContext';
import { AppNotification, NotificationType } from '../../../shared/types';

type IconName = keyof typeof Ionicons.glyphMap;

const META: Record<NotificationType, { icon: IconName; bg: string; fg: string }> = {
  MATCH_REQUEST:  { icon: 'person-add',        bg: colors.primaryLight, fg: colors.primaryDark },
  MATCH_ACCEPTED: { icon: 'people',            bg: colors.primaryLight, fg: colors.primaryDark },
  TASK_ASSIGNED:  { icon: 'checkbox',          bg: colors.infoLight,    fg: colors.info },
  EVENT_REMINDER: { icon: 'calendar',          bg: colors.infoLight,    fg: colors.info },
  ANNOUNCEMENT:   { icon: 'megaphone',         bg: colors.navyTint,     fg: colors.navy },
  MENTOR_BOOKING: { icon: 'school',            bg: colors.warningLight, fg: colors.warning },
  POINTS_AWARDED: { icon: 'flash',             bg: colors.warningLight, fg: colors.warning },
  SYSTEM:         { icon: 'information-circle', bg: colors.divider,     fg: colors.textSecondary },
};

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen(): React.ReactElement {
  const navigation = useNavigation<{ goBack: () => void; navigate: (screen: string, params?: Record<string, unknown>) => void }>();
  const { items, loadingInbox, loadInbox, markRead, markAllRead, unreadCount } = useNotifications();

  useEffect(() => { void loadInbox(); }, [loadInbox]);

  const open = useCallback((n: AppNotification) => {
    if (!n.readAt) void markRead(n.id);
    const d = n.data ?? {};
    switch (n.type) {
      case 'MATCH_REQUEST':
      case 'MATCH_ACCEPTED':
        navigation.navigate('Tabs', { screen: 'MatchMe' });
        return;
      case 'EVENT_REMINDER':
      case 'POINTS_AWARDED':
        if (d.eventId) { navigation.navigate('EventDetail', { eventId: d.eventId }); return; }
        navigation.navigate('PointsHistory');
        return;
      case 'TASK_ASSIGNED':
        if (d.taskId) { navigation.navigate('TaskDetail', { taskId: d.taskId }); return; }
        navigation.navigate('Tabs', { screen: 'MyTasks' });
        return;
      case 'MENTOR_BOOKING':
        navigation.navigate('MentorBooking');
        return;
      default:
        return;
    }
  }, [markRead, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        onBack={() => navigation.goBack()}
        right={
          unreadCount > 0 ? (
            <Pressable onPress={() => { void markAllRead(); }} hitSlop={8} accessibilityRole="button">
              <Text style={styles.readAll}>Mark all read</Text>
            </Pressable>
          ) : undefined
        }
      />
      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.list}
        refreshControl={<RefreshControl refreshing={loadingInbox} onRefresh={() => { void loadInbox(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          loadingInbox ? null : (
            <EmptyState
              icon="notifications-off-outline"
              title="You're all caught up"
              message="Invitations, points, and reminders will land here."
            />
          )
        }
        renderItem={({ item }) => {
          const meta = META[item.type] ?? META.SYSTEM;
          const unread = !item.readAt;
          return (
            <Pressable
              onPress={() => open(item)}
              style={({ pressed }) => [styles.row, unread && styles.rowUnread, pressed && styles.rowPressed]}
              accessibilityRole="button"
            >
              <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                <Ionicons name={meta.icon} size={18} color={meta.fg} />
              </View>
              <View style={styles.textCol}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, unread && styles.titleUnread]} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
              </View>
              {unread ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  readAll: { ...type.caption, color: colors.primaryDark, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg,
    ...elevation('sm'),
  },
  rowUnread: { backgroundColor: colors.primaryTint, borderLeftWidth: 3, borderLeftColor: colors.primary },
  rowPressed: { opacity: 0.85 },
  iconWrap: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  textCol: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...type.label, color: colors.textPrimary, flex: 1, fontWeight: '600' },
  titleUnread: { fontWeight: '700' },
  time: { ...type.caption, color: colors.textTertiary },
  body: { ...type.bodySm, color: colors.textSecondary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
