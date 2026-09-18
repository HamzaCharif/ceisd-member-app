// /mobile/screens/profile/ProfileScreen.tsx
// Profile screen — matches spec Screen 0.5 exactly.

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  SafeAreaView, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { get } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS, STAGE_LABELS, STAGE_COLORS } from '../../../shared/constants';
import { User, UserProfile, StageInfo, Match, ApiResponse, StageType } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';
import JourneyProgress from './JourneyProgress';
import EngagementBadge from './EngagementBadge';

interface ProfileData {
  user: User & { profile?: UserProfile };
  stageInfo: StageInfo;
  eventsAttended: number;
  suggestions: Array<Partial<Match>>;
}

const STAGE_ACTIVITIES: Record<StageType, string[]> = {
  SPARK: ['Attend a Workshop', 'Join a Notice Board discussion'],
  SHAPE: ['Host a Workshop', 'Lead a Brainstorming Session'],
  SCALE: ['Mentor a peer', 'Submit a project proposal'],
  MENTOR: ['Lead a CEISD event', 'Publish a resource'],
};

export default function ProfileScreen(): React.ReactElement {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const { userId, signOut } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile(): Promise<void> {
    try {
      const [userRes, stageRes] = await Promise.all([
        get<ApiResponse<User & { profile?: UserProfile }>>(API_ENDPOINTS.AUTH_ME),
        get<ApiResponse<StageInfo>>(API_ENDPOINTS.GAMIFICATION_MY_STAGE),
      ]);

      // Count attended events
      let eventsAttended = 0;
      let suggestions: Array<Partial<Match>> = [];

      try {
        // STUB - replace when Agent 5 is complete
        const sugRes = await get<ApiResponse<Array<Partial<Match>>>>(API_ENDPOINTS.MATCHING_SUGGESTIONS);
        suggestions = sugRes.data.slice(0, 2);
      } catch {
        // Agent 5 not yet built — show empty state
      }

      setData({
        user: userRes.data,
        stageInfo: stageRes.data,
        eventsAttended,
        suggestions,
      });
    } catch {
      // fail silently — show empty state
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const user = data?.user;
  const stageInfo = data?.stageInfo;
  const currentStage: StageType = (stageInfo?.stage ?? 'SPARK') as StageType;
  const activities = STAGE_ACTIVITIES[currentStage] ?? STAGE_ACTIVITIES.SPARK;
  const stageColor = STAGE_COLORS[currentStage] ?? COLORS.primary;

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* TOP SECTION */}
        <View style={styles.topSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Member'}</Text>
          <Text style={styles.affiliation}>{user?.college ?? 'AUS'}</Text>
          {/* Stage badge */}
          {stageInfo && (
            <View style={[styles.stageBadge, { backgroundColor: stageColor }]}>
              <Text style={styles.stageBadgeText}>{STAGE_LABELS[currentStage]}</Text>
            </View>
          )}
          {stageInfo && <EngagementBadge level={stageInfo.engagementLevel} />}
        </View>

        {/* MY CEISD JOURNEY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My CEISD Journey</Text>
          {stageInfo && (
            <JourneyProgress
              currentStage={currentStage}
              totalPoints={stageInfo.totalPoints}
            />
          )}
        </View>

        {/* RECOMMENDED ACTIVITIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Activities</Text>
          <View style={styles.activitiesRow}>
            {activities.map((activity) => (
              <View key={activity} style={styles.activityCard}>
                <Ionicons name="star-outline" size={24} color="#1D9E75" style={{ marginBottom: 6 }} />
                <Text style={styles.activityLabel}>{activity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* SUGGESTED COLLABORATORS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Collaborators</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MatchMe')}>
              <Text style={styles.seeAll}>See all ›</Text>
            </TouchableOpacity>
          </View>

          {data?.suggestions && data.suggestions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collaboratorsRow}>
              {data.suggestions.map((match, index) => {
                const collaborator = match.user1?.id === userId ? match.user2 : match.user1;
                const colInitials = (collaborator?.name ?? 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <View key={match.id ?? index} style={styles.collaboratorCard}>
                    <View style={styles.collaboratorAvatar}>
                      <Text style={styles.collaboratorAvatarText}>{colInitials}</Text>
                    </View>
                    <Text style={styles.collaboratorName} numberOfLines={1}>
                      {collaborator?.name ?? 'Member'}
                    </Text>
                    <Text style={styles.collaboratorScore}>
                      {match.compatibilityScore ? `${Math.round(match.compatibilityScore)}% match` : ''}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={styles.emptyText}>Matches will appear as the community grows.</Text>
          )}
        </View>

        {/* STATS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Activity</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={24} color="#1D9E75" style={{ marginBottom: 8 }} />
              <Text style={styles.statValue}>{data?.eventsAttended ?? 0}</Text>
              <Text style={styles.statLabel}>Events Attended</Text>
            </View>
            <View style={[styles.statCard, { marginLeft: 12 }]}>
              <Ionicons name="trophy-outline" size={24} color="#1D9E75" style={{ marginBottom: 8 }} />
              <Text style={styles.statValue}>{stageInfo?.totalPoints ?? 0}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.historyLink}
            onPress={() => navigation.navigate('PointsHistory')}
          >
            <Text style={styles.historyLinkText}>View points history ›</Text>
          </TouchableOpacity>
        </View>

        {/* SIGN OUT */}
        <TouchableOpacity style={styles.signOutBtn} onPress={signOut} activeOpacity={0.8}>
          <View style={styles.signOutInner}>
            <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.signOutBtnText}>Sign Out</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { paddingBottom: 40 },
  topSection: { alignItems: 'center', paddingTop: 32, paddingBottom: 24, backgroundColor: '#F5F5F5' },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#1D9E75', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginTop: 12 },
  affiliation: { fontSize: 14, color: '#6B7280' },
  stageBadge: {
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4,
    marginTop: 8, marginBottom: 6,
  },
  stageBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: {
    backgroundColor: '#FFFFFF', borderRadius: 16, margin: 12, padding: 16,
    ...Platform.select({
      native: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.06)' },
    }),
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  seeAll: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  activitiesRow: { flexDirection: 'row', gap: 10 },
  activityCard: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  activityLabel: { fontSize: 13, color: '#1A1A1A', fontWeight: '600', textAlign: 'center' },
  collaboratorsRow: { flexDirection: 'row' },
  collaboratorCard: { alignItems: 'center', marginRight: 16, width: 80 },
  collaboratorAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#E8F7F2', alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  collaboratorAvatarText: { color: '#1D9E75', fontSize: 18, fontWeight: '700' },
  collaboratorName: { fontSize: 12, color: '#1A1A1A', fontWeight: '600', textAlign: 'center' },
  collaboratorScore: { fontSize: 11, color: '#1D9E75', marginTop: 2 },
  emptyText: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },
  statsRow: { flexDirection: 'row' },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#1A1A1A' },
  statLabel: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  historyLink: { marginTop: 14, alignItems: 'center' },
  historyLinkText: { fontSize: 14, color: '#1D9E75', fontWeight: '600' },
  signOutBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    margin: 16,
    marginTop: 4,
  },
  signOutInner: { flexDirection: 'row', alignItems: 'center' },
  signOutBtnText: { color: '#DC2626', fontSize: 15, fontWeight: '600' },
});
