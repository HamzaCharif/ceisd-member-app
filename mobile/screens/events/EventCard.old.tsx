// /mobile/screens/events/EventCard.tsx
// Renders a single event card in the Events Feed.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { Event, ApiResponse } from '../../../shared/types';

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
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
      activeOpacity={0.9}
    >
      {/* Banner image */}
      {event.bannerImage ? (
        <Image source={{ uri: event.bannerImage }} style={styles.banner} />
      ) : (
        <View style={styles.bannerPlaceholder}>
          <Ionicons name="calendar-outline" size={48} color="#1D9E75" />
        </View>
      )}

      <View style={styles.body}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

        {/* Date row */}
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{formattedDate}</Text>
        </View>

        {/* Location row */}
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.metaText}>{event.location}</Text>
        </View>

        {/* Seats row */}
        <View style={styles.metaRow}>
          <Ionicons name="people-outline" size={14} color={seatsRemaining <= 5 ? '#F59E0B' : '#6B7280'} />
          <Text style={[styles.metaText, seatsRemaining <= 5 && styles.metaWarning]}>
            Seats Remaining: {seatsRemaining}/{event.totalSeats}
          </Text>
        </View>

        {/* Points label */}
        <Text style={styles.points}>Earn {event.pointsForAttendance} pts for attendance</Text>

        {/* RSVP messages */}
        {rsvpMsg && <Text style={styles.rsvpSuccessText}>{rsvpMsg}</Text>}
        {rsvpError && <Text style={styles.rsvpErrorText}>{rsvpError}</Text>}

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rsvpBtn, hasRsvpd && styles.rsvpBtnDone]}
            onPress={handleRsvp}
            disabled={rsvpLoading || hasRsvpd}
            activeOpacity={0.8}
          >
            {rsvpLoading ? (
              <ActivityIndicator size="small" color={hasRsvpd ? '#1D9E75' : '#fff'} />
            ) : hasRsvpd ? (
              <View style={styles.rsvpDoneInner}>
                <Ionicons name="checkmark" size={16} color="#1D9E75" style={styles.rsvpIcon} />
                <Text style={styles.rsvpTextDone}>Attending</Text>
              </View>
            ) : (
              <Text style={styles.rsvpText}>RSVP</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    ...Platform.select({
      native: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  banner: { width: '100%', height: 140, resizeMode: 'cover' },
  bannerPlaceholder: {
    width: '100%',
    height: 140,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 14 },
  title: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metaText: { fontSize: 13, color: '#6B7280', marginLeft: 6 },
  metaWarning: { color: '#F59E0B' },
  points: { fontSize: 12, color: '#1D9E75', fontWeight: '600', marginTop: 4, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rsvpBtn: {
    flex: 1,
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rsvpBtnDone: { backgroundColor: '#E8F7F2' },
  rsvpDoneInner: { flexDirection: 'row', alignItems: 'center' },
  rsvpIcon: { marginRight: 4 },
  rsvpText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  rsvpTextDone: { color: '#1D9E75', fontSize: 14, fontWeight: '600' },
  rsvpSuccessText: { fontSize: 12, color: '#1D9E75', fontWeight: '500', marginBottom: 6 },
  rsvpErrorText: { fontSize: 12, color: '#DC2626', marginBottom: 6 },
});
