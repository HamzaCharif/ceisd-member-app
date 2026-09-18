// /mobile/screens/home/HomeScreen.tsx
// REFERENCE MIGRATION — shows how to consume the new design system.
// Compare to the old version: zero hardcoded hex values, consistent spacing
// from tokens, polished SegmentedControl, proper type scale and elevation.
//
// Layout per spec: TOP tabs (Announcements | Notice Board | Chat) + events feed.

import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { colors, spacing, type } from '../../theme/theme';
import { SegmentedControl, SegmentOption, NotificationBell } from '../../components';
import AnnouncementsTab from './AnnouncementsTab';
import NoticeBoardTab from './NoticeBoardTab';
import ChatTabPlaceholder from './ChatTabPlaceholder';
import EventsFeed from '../events/EventsFeed';

type TabId = 'announcements' | 'noticeboard' | 'chat';

const TABS: SegmentOption<TabId>[] = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'noticeboard', label: 'Notice Board' },
  { id: 'chat', label: 'Chat' },
];

export default function HomeScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('announcements');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.brand}>CEISD</Text>
        </View>
        <NotificationBell />
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={TABS} value={activeTab} onChange={setActiveTab} />
      </View>

      <View style={styles.tabContent}>
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'noticeboard' && <NoticeBoardTab />}
        {activeTab === 'chat' && <ChatTabPlaceholder />}
      </View>

      <View style={styles.eventsFeedSection}>
        <Text style={styles.sectionHeader}>Upcoming Events</Text>
        <EventsFeed />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  greeting: { ...type.bodySm, color: colors.textSecondary },
  brand: { ...type.h1, color: colors.navy },
  tabsWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg, marginTop: spacing.xs },
  tabContent: { flex: 3 },
  eventsFeedSection: {
    flex: 5,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    ...type.h3,
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
