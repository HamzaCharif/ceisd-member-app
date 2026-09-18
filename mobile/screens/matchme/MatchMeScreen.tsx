// /mobile/screens/matchme/MatchMeScreen.tsx
// Three sections, in priority order:
//   1. Invitations waiting for you  (highest urgency — someone is waiting)
//   2. Your connections
//   3. Suggested matches (AI-ranked)
// Matches are generated once per session (or on pull-to-refresh) — not on
// every visit, which was slow and re-ranked people under the user's thumb.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, SectionList, StyleSheet, SafeAreaView, RefreshControl, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { post, get } from '../../../shared/api-client';
import { API_ENDPOINTS } from '../../../shared/constants';
import { Match, MatchStatus, ApiResponse } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { colors, radius, spacing, type } from '../../theme/theme';
import { EmptyState, NotificationBell } from '../../components';
import MatchCard from './MatchCard';

interface Section { title: string; hint?: string; data: Match[]; }

export default function MatchMeScreen(): React.ReactElement {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const { userId } = useAuth();
  const { refreshCount } = useNotifications();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const generatedThisSession = useRef(false);

  const fetchList = useCallback(async () => {
    const res = await get<ApiResponse<Match[]>>(API_ENDPOINTS.MATCHING_MY_MATCHES);
    setMatches(res.data);
  }, []);

  const generate = useCallback(async () => {
    setGenerating(true);
    try {
      await post<ApiResponse<unknown>>(API_ENDPOINTS.MATCHING_GENERATE, {});
      generatedThisSession.current = true;
      await fetchList();
    } finally {
      setGenerating(false);
    }
  }, [fetchList]);

  const load = useCallback(async (force = false) => {
    setError(null);
    try {
      await fetchList();
      if (force || !generatedThisSession.current) await generate();
    } catch {
      setError("Couldn't load matches. Pull down to retry.");
    } finally {
      setLoading(false);
    }
  }, [fetchList, generate]);

  useEffect(() => { void load(); }, [load]);
  // Coming back from the inbox after an invite → refresh silently
  useFocusEffect(useCallback(() => { if (!loading) void fetchList().catch(() => undefined); }, [fetchList, loading]));

  const onUpdated = useCallback(() => { void fetchList().catch(() => undefined); void refreshCount(); }, [fetchList, refreshCount]);

  const sections = useMemo<Section[]>(() => {
    const invites = matches.filter((m) => m.awaitingMyResponse);
    const connected = matches.filter((m) => m.status === MatchStatus.CONNECTED);
    const rest = matches.filter((m) => !m.awaitingMyResponse && m.status !== MatchStatus.CONNECTED);
    const out: Section[] = [];
    if (invites.length) out.push({ title: 'Waiting for you', hint: `${invites.length} invitation${invites.length === 1 ? '' : 's'}`, data: invites });
    if (connected.length) out.push({ title: 'Your connections', data: connected });
    if (rest.length) out.push({ title: 'Suggested for you', hint: 'Ranked by shared interests, skills and activity', data: rest });
    return out;
  }, [matches]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>AI-powered</Text>
          <Text style={styles.heading}>Match Me</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('MentorBooking')} style={({ pressed }) => [styles.mentorBtn, pressed && { opacity: 0.8 }]}>
          <Ionicons name="school-outline" size={16} color={colors.primaryDark} />
          <Text style={styles.mentorBtnText}>Book mentor</Text>
        </Pressable>
        <NotificationBell />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{generating ? 'Finding your best collaborators…' : 'Loading…'}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(m) => m.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={sections.length === 0 ? styles.emptyWrap : styles.list}
          refreshControl={<RefreshControl refreshing={generating} onRefresh={() => { void load(true); }} tintColor={colors.primary} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.hint ? <Text style={styles.sectionHint}>{section.hint}</Text> : null}
            </View>
          )}
          renderItem={({ item }) => <MatchCard match={item} currentUserId={userId ?? ''} onUpdated={onUpdated} />}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No matches yet"
              message="As more members complete their profiles, your best collaborators will show up here. Pull down to refresh."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md,
  },
  eyebrow: { ...type.overline, color: colors.primaryDark, textTransform: 'uppercase' },
  heading: { ...type.h1, color: colors.navy },
  mentorBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primaryLight, borderRadius: radius.pill,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  mentorBtnText: { ...type.caption, color: colors.primaryDark, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
  loadingText: { ...type.body, color: colors.textSecondary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  emptyWrap: { flexGrow: 1, justifyContent: 'center' },
  sectionHeader: { paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: 2 },
  sectionTitle: { ...type.h3, color: colors.textPrimary },
  sectionHint: { ...type.caption, color: colors.textSecondary },
  error: { ...type.bodySm, color: colors.error, marginBottom: spacing.sm },
});
