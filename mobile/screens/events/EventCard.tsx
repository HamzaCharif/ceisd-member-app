// /mobile/screens/events/EventCard.tsx
// Event card — spec §5.2. Sprint 2 design-system upgrade.
// LOGIC UNCHANGED: same RSVP flow, same seat math, same navigation.

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { post } from '../../../shared/api-client';
import { API_ENDPOINTS } from '../../../shared/constants';
import { Event, ApiResponse } from '../../../shared/types';
import { colors, spacing, radius, type, elevation, motion } from '../../theme/theme';
import { Badge, Button } from '../../components';

interface Props {
  event: Event;
  onRsvpChanged: () => void;
}

export default function EventCard({ event, onRsvpChanged }: Props): React.ReactElement {
  const navigation = useNavigation<{ navigate: (screen: string, params: object) => void }>();
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);
  const [hasRsvpd, setHasRsvpd] = useState(!!event.hasRsvp);
  const [rsvpMsg, setRsvpMsg] = useState<string | null>(null);

  const seatsRemaining = event.totalSeats - event.rsvpCount;
  const lowSeats = seatsRemaining <= 5;
  const formattedDate = new Date(event.dateTime).toLocaleDateString('en-AE', {
    weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  async function handleRsvp(): Promise<void> {
    if (hasRsvpd) return;
    setRsvpLoading(true);
    try {
      const response = await post<ApiResponse<{ message: string }>>(API_ENDPOINTS.EVENTS_RSVP(event.id));
      setHasRsvpd(true);
      const msg = response.data?.message ?? "You're registered!";
      setRsvpMsg(msg);
      setTimeout(() => setRsvpMsg(null), 3000);
      onRsvpChanged();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to RSVP';
      setRsvpError(msg);
    } finally {
      setRsvpLoading(false);
    }
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        elevation('md'),
        pressed ? { opacity: motion.pressedOpacity, transform: [{ scale: 0.99 }] } : {},
      ]}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
      accessibilityRole="button"
    >
      {/* Banner */}
      <View style={styles.bannerWrap}>
        {event.bannerImage ? (
          <Image source={{ uri: event.bannerImage }} style={styles.banner} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="calendar-outline" size={44} color={colors.primary} />
          </View>
        )}
        {/* Points chip overlaid on banner */}
        <View style={styles.pointsChip}>
          <Ionicons name="star" size={11} color={colors.warning} />
          <Text style={styles.pointsChipText}>+{event.pointsForAttendance} pts</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
        </View>

        {/* Seats: soft badge, amber when scarce */}
        <View style={styles.seatsRow}>
          <Badge
            label={`${seatsRemaining}/${event.totalSeats} seats left`}
            tone={lowSeats ? 'warning' : 'neutral'}
            size="sm"
          />
          {lowSeats && <Text style={styles.hurryText}>Filling fast</Text>}
        </View>

        {rsvpMsg && (
          <View style={styles.inlineNote}>
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            <Text style={styles.inlineNoteText}>{rsvpMsg}</Text>
          </View>
        )}
        {rsvpError && (
          <View style={styles.inlineNote}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <Text style={[styles.inlineNoteText, { color: colors.error }]}>{rsvpError}</Text>
          </View>
        )}

        <Button
          title={hasRsvpd ? 'Attending ✓' : 'RSVP'}
          onPress={handleRsvp}
          loading={rsvpLoading}
          disabled={hasRsvpd}
          variant={hasRsvpd ? 'outline' : 'primary'}
          size="sm"
          style={styles.rsvpButton}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  bannerWrap: { position: 'relative' },
  banner: { width: '100%', height: 140, resizeMode: 'cover' },
  bannerPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsChip: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 24, 40, 0.75)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
  },
  pointsChipText: { ...type.caption, color: colors.white, fontWeight: '700' },
  body: { padding: spacing.lg },
  title: { ...type.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs, gap: 6 },
  metaText: { ...type.bodySm, color: colors.textSecondary, flex: 1 },
  seatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  hurryText: { ...type.caption, color: colors.warning, fontWeight: '600' },
  inlineNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  inlineNoteText: { ...type.caption, color: colors.success, fontWeight: '600' },
  rsvpButton: { marginTop: spacing.xs },
});
