// /mobile/screens/home/HomeScreen.tsx
// Home screen container — three-section layout:
//   TOP 30%:    Tab bar (Announcements | Notice Board | Chat)
//   MIDDLE 50%: Scrollable Events Feed (always visible)
//   BOTTOM 20%: BottomActionBar placeholder (rendered by RootNavigator via tab bar)

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { COLORS } from '../../../shared/constants';
import AnnouncementsTab from './AnnouncementsTab';
import NoticeBoardTab from './NoticeBoardTab';
import ChatTabPlaceholder from './ChatTabPlaceholder';
import EventsFeed from '../events/EventsFeed';

type TabId = 'announcements' | 'noticeboard' | 'chat';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'announcements', label: 'Announcements' },
  { id: 'noticeboard', label: 'Notice Board' },
  { id: 'chat', label: 'Chat' },
];

export default function HomeScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabId>('announcements');

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP: Tab selector */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabItem, activeTab === tab.id && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TOP content area */}
      <View style={styles.tabContent}>
        {activeTab === 'announcements' && <AnnouncementsTab />}
        {activeTab === 'noticeboard' && <NoticeBoardTab />}
        {activeTab === 'chat' && <ChatTabPlaceholder />}
      </View>

      {/* MIDDLE: Events feed — always visible */}
      <View style={styles.eventsFeedSection}>
        <Text style={styles.sectionHeader}>Upcoming Events</Text>
        <EventsFeed />
      </View>

      {/* BOTTOM: BottomActionBar rendered by RootNavigator */}
      {/* TODO: BottomActionBar rendered by RootNavigator */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  tabItemActive: {
    backgroundColor: '#FFFFFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  tabLabelActive: {
    color: '#1D9E75',
    fontWeight: '600',
  },
  tabContent: {
    flex: 3,  // ~30% of remaining space
  },
  eventsFeedSection: {
    flex: 5,  // ~50% of remaining space
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
