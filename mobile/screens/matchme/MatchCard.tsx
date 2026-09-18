// /mobile/screens/matchme/MatchCard.tsx
// One match. Renders the right actions for whichever side of the invitation you're on:
//   PENDING / SAVED        → Connect · Save · Skip
//   REQUESTED (I sent it)  → "Invitation sent" (waiting)
//   REQUESTED (sent to me) → Accept · Decline
//   CONNECTED              → Connected

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { patch } from '../../../shared/api-client';
import { API_ENDPOINTS, STAGE_LABELS } from '../../../shared/constants';
import { Match, MatchStatus, ApiResponse } from '../../../shared/types';
import { colors, radius, spacing, type, elevation } from '../../theme/theme';
import { Avatar, Badge } from '../../components';

type Action = 'CONNECT' | 'ACCEPT' | 'DECLINE' | 'SAVE' | 'REJECT';

interface Props {
  match: Match;
  currentUserId: string;
  onUpdated: () => void;
}

type OtherUser = NonNullable<Match['other']>;

function topSkills(profile: OtherUser['profile'] | undefined): string[] {
  const ratings = (profile as { skillRatings?: unknown } | undefined)?.skillRatings;
  if (Array.isArray(ratings)) {
    return (ratings as Array<{ skill: string; rating: number }>)
      .filter((r) => r && typeof r.skill === 'string')
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3)
      .map((r) => r.skill);
  }
  if (ratings && typeof ratings === 'object') {
    return Object.entries(ratings as Record<string, number>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k]) => k);
  }
  return [];
}

export default function MatchCard({ match, currentUserId, onUpdated }: Props): React.ReactElement {
  const [loading, setLoading] = useState<Action | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localStatus, setLocalStatus] = useState<MatchStatus>(match.status);
  const [localRequester, setLocalRequester] = useState<string | null | undefined>(match.requestedById);

  const other: OtherUser | undefined = match.other ?? (match.userId1 === currentUserId ? match.user2 : match.user1);
  const skills = topSkills(other?.profile);
  const stage = other?.userStage?.stage;
  const score = Math.round(match.compatibilityScore);

  const iRequested = localStatus === MatchStatus.REQUESTED && localRequester === currentUserId;
  const awaitingMe = localStatus === MatchStatus.REQUESTED && localRequester !== currentUserId;

  async function act(action: Action): Promise<void> {
    setLoading(action);
    setErrorMsg(null);
    try {
      const res = await patch<ApiResponse<Match>>(API_ENDPOINTS.MATCHING_MATCH(match.id), { action });
      setLocalStatus(res.data.status);
      setLocalRequester(res.data.requestedById);
      onUpdated();
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Something went wrong. Try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;
  const rejected = localStatus === MatchStatus.REJECTED;

  return (
    <View style={[styles.card, awaitingMe && styles.cardHighlight, rejected && styles.cardMuted]}>
      {awaitingMe ? (
        <View style={styles.inviteBanner}>
          <Ionicons name="mail-unread" size={14} color={colors.primaryDark} />
          <Text style={styles.inviteBannerText}>{other?.name?.split(' ')[0] ?? 'They'} invited you to connect</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Avatar name={other?.name ?? 'Member'} size={48} />
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>{other?.name ?? 'Member'}</Text>
          <View style={styles.metaRow}>
            {other?.college ? <Text style={styles.meta}>{other.college}</Text> : null}
            {stage ? <Badge label={STAGE_LABELS[stage] ?? stage} tone="primary" size="sm" /> : null}
          </View>
        </View>
        <View style={styles.score}>
          <Text style={styles.scoreValue}>{score}<Text style={styles.scorePct}>%</Text></Text>
          <Text style={styles.scoreLabel}>match</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(score, 100)}%` }]} />
      </View>

      {skills.length > 0 ? (
        <View style={styles.tags}>
          {skills.map((s) => <Badge key={s} label={s} tone="neutral" size="sm" />)}
        </View>
      ) : null}

      {match.explanation ? <Text style={styles.explanation}>{match.explanation}</Text> : null}
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

      {/* Actions */}
      {localStatus === MatchStatus.CONNECTED ? (
        <View style={styles.stateRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          <Text style={styles.stateText}>Connected · you can now message each other</Text>
        </View>
      ) : rejected ? (
        <View style={styles.stateRow}>
          <Text style={[styles.stateText, { color: colors.textTertiary }]}>Skipped</Text>
        </View>
      ) : iRequested ? (
        <View style={styles.stateRow}>
          <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.stateText}>Invitation sent · waiting for {other?.name?.split(' ')[0] ?? 'them'}</Text>
        </View>
      ) : awaitingMe ? (
        <View style={styles.actions}>
          <Pressable onPress={() => act('ACCEPT')} disabled={busy} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            {loading === 'ACCEPT' ? <ActivityIndicator color={colors.white} /> : (
              <View style={styles.btnRow}>
                <Ionicons name="checkmark" size={16} color={colors.white} />
                <Text style={styles.primaryBtnText}>Accept</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => act('DECLINE')} disabled={busy} style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}>
            {loading === 'DECLINE' ? <ActivityIndicator color={colors.textSecondary} /> : <Text style={styles.ghostBtnText}>Decline</Text>}
          </Pressable>
        </View>
      ) : (
        <View style={styles.actions}>
          <Pressable onPress={() => act('CONNECT')} disabled={busy} style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            {loading === 'CONNECT' ? <ActivityIndicator color={colors.white} /> : (
              <View style={styles.btnRow}>
                <Ionicons name="person-add" size={15} color={colors.white} />
                <Text style={styles.primaryBtnText}>Connect</Text>
              </View>
            )}
          </Pressable>
          {localStatus === MatchStatus.SAVED ? (
            <View style={[styles.outlineBtn, styles.outlineBtnDone]}>
              <Ionicons name="bookmark" size={14} color={colors.primaryDark} />
              <Text style={styles.outlineBtnText}>Saved</Text>
            </View>
          ) : (
            <Pressable onPress={() => act('SAVE')} disabled={busy} style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]}>
              {loading === 'SAVE' ? <ActivityIndicator color={colors.primaryDark} /> : (
                <>
                  <Ionicons name="bookmark-outline" size={14} color={colors.primaryDark} />
                  <Text style={styles.outlineBtnText}>Save</Text>
                </>
              )}
            </Pressable>
          )}
          <Pressable onPress={() => act('REJECT')} disabled={busy} hitSlop={6} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.md, ...elevation('md'),
  },
  cardHighlight: { borderWidth: 1.5, borderColor: colors.primary },
  cardMuted: { opacity: 0.55 },
  inviteBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    alignSelf: 'flex-start', backgroundColor: colors.primaryLight,
    borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  inviteBannerText: { ...type.caption, color: colors.primaryDark, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  headerInfo: { flex: 1, gap: 4 },
  name: { ...type.h3, color: colors.textPrimary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { ...type.caption, color: colors.textSecondary },
  score: { alignItems: 'flex-end' },
  scoreValue: { ...type.h1, color: colors.primaryDark, lineHeight: 30 },
  scorePct: { ...type.label, color: colors.primaryDark },
  scoreLabel: { ...type.overline, color: colors.textTertiary, textTransform: 'uppercase' },
  track: { height: 5, borderRadius: 3, backgroundColor: colors.divider, overflow: 'hidden', marginBottom: spacing.md },
  fill: { height: 5, borderRadius: 3, backgroundColor: colors.primary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
  explanation: { ...type.bodySm, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  error: { ...type.caption, color: colors.error, marginBottom: spacing.sm },
  stateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xs },
  stateText: { ...type.bodySm, color: colors.textSecondary, fontWeight: '600', flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  primaryBtn: {
    flex: 2, backgroundColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  primaryBtnText: { ...type.label, color: colors.white },
  ghostBtn: { flex: 1, borderRadius: radius.md, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.divider, minHeight: 44 },
  ghostBtnText: { ...type.label, color: colors.textSecondary },
  outlineBtn: {
    flex: 1, flexDirection: 'row', gap: 6, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.md,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center', minHeight: 44,
  },
  outlineBtnDone: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  outlineBtnText: { ...type.label, color: colors.primaryDark },
  skipBtn: { paddingHorizontal: spacing.sm, paddingVertical: 12 },
  skipText: { ...type.bodySm, color: colors.textTertiary, fontWeight: '600' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
