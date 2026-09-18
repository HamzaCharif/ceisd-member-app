// /mobile/screens/events/EventDetailScreen.tsx
// Full event detail screen — matches spec Screen 0.3.
// Includes calendar integration via expo-calendar.

import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Calendar from 'expo-calendar';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { get, post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { Event, ApiResponse } from '../../../shared/types';

type Props = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'EventDetail'>;
  route: RouteProp<{ EventDetail: { eventId: string } }, 'EventDetail'>;
};

export default function EventDetailScreen({ navigation, route }: Props): React.ReactElement {
  const { eventId } = route.params;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarMsg, setCalendarMsg] = useState<string | null>(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [rsvpMsg, setRsvpMsg] = useState<string | null>(null);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  async function fetchEvent(): Promise<void> {
    try {
      const response = await get<ApiResponse<Event>>(`${API_ENDPOINTS.EVENTS}/${eventId}`);
      setEvent(response.data);
      setHasRsvpd(!!(response.data as Event & { hasRsvp?: boolean }).hasRsvp);
    } catch {
      setError('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRsvp(): Promise<void> {
    if (hasRsvpd) return;
    setRsvpLoading(true);
    setRsvpError(null);
    try {
      const response = await post<ApiResponse<{ message: string }>>(API_ENDPOINTS.EVENTS_RSVP(eventId));
      setHasRsvpd(true);
      const msg = response.data?.message ?? "You're registered!";
      setRsvpMsg(msg);
      setTimeout(() => setRsvpMsg(null), 3000);
      fetchEvent();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to RSVP';
      setRsvpError(msg);
    } finally {
      setRsvpLoading(false);
    }
  }

  async function addToCalendar(): Promise<void> {
    if (!event) return;
    if (Platform.OS === 'web') {
      setCalendarMsg('Calendar integration is only available on the mobile app.');
      setTimeout(() => setCalendarMsg(null), 3000);
      return;
    }
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      setCalendarMsg('Calendar access is required to add this event.');
      return;
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCalendar = calendars.find((c) => c.allowsModifications) ?? calendars[0];
    if (!defaultCalendar) {
      setCalendarMsg('No writable calendar found.');
      return;
    }
    await Calendar.createEventAsync(defaultCalendar.id, {
      title: event.title,
      location: event.location,
      startDate: new Date(event.dateTime),
      endDate: new Date(new Date(event.dateTime).getTime() + 2 * 60 * 60 * 1000), // +2 hours
      notes: event.description,
    });
    setCalendarMsg('Event added to your calendar!');
    setTimeout(() => setCalendarMsg(null), 3000);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error ?? 'Event not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBackBtn}>
          <Text style={styles.errorBackBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDate = new Date(event.dateTime).toLocaleDateString('en-AE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
      </TouchableOpacity>

      <ScrollView>
        {/* Banner */}
        {event.bannerImage ? (
          <Image source={{ uri: event.bannerImage }} style={styles.banner} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <Ionicons name="calendar-outline" size={64} color="#1D9E75" />
          </View>
        )}

        <View style={styles.body}>
          {/* Title */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date row */}
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#6B7280" />
            <Text style={styles.meta}>{formattedDate}</Text>
          </View>

          {/* Location row */}
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color="#6B7280" />
            <Text style={styles.meta}>{event.location}</Text>
          </View>

          {/* Attendees row */}
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={16} color="#6B7280" />
            <Text style={styles.meta}>
              {event.rsvpCount ?? 0} attending
              {event.totalSeats > 0
                ? ` · ${event.totalSeats - (event.rsvpCount ?? 0)} seats remaining`
                : ''}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>{event.description}</Text>

          {/* Speaker */}
          {event.speakerName && (
            <View style={styles.speakerCard}>
              <View style={styles.speakerAvatar}>
                {event.speakerAvatar ? (
                  <Image source={{ uri: event.speakerAvatar }} style={styles.speakerAvatarImg} />
                ) : (
                  <Text style={styles.speakerAvatarText}>
                    {event.speakerName.slice(0, 2).toUpperCase()}
                  </Text>
                )}
              </View>
              <View>
                <Text style={styles.speakerName}>{event.speakerName}</Text>
                {event.speakerRole && (
                  <Text style={styles.speakerRole}>{event.speakerRole}</Text>
                )}
              </View>
            </View>
          )}

          {/* Calendar message */}
          {calendarMsg && (
            <View style={styles.calendarMsgBox}>
              <Text style={styles.calendarMsgText}>{calendarMsg}</Text>
            </View>
          )}

          {/* RSVP messages */}
          {rsvpMsg && (
            <View style={styles.calendarMsgBox}>
              <Text style={styles.calendarMsgText}>{rsvpMsg}</Text>
            </View>
          )}
          {rsvpError && (
            <View style={styles.rsvpErrorBox}>
              <Text style={styles.rsvpErrorText}>{rsvpError}</Text>
            </View>
          )}

          {/* Register/RSVP button */}
          <TouchableOpacity
            style={[styles.registerBtn, hasRsvpd && styles.registerBtnDone]}
            onPress={handleRsvp}
            disabled={rsvpLoading || hasRsvpd}
            activeOpacity={0.8}
          >
            {rsvpLoading ? (
              <ActivityIndicator color={hasRsvpd ? '#1D9E75' : '#fff'} />
            ) : hasRsvpd ? (
              <View style={styles.rsvpDoneInner}>
                <Ionicons name="checkmark" size={18} color="#1D9E75" style={styles.rsvpIcon} />
                <Text style={styles.registerBtnTextDone}>Attending</Text>
              </View>
            ) : (
              <Text style={styles.registerBtnText}>Register / RSVP</Text>
            )}
          </TouchableOpacity>

          {/* QR button */}
          <TouchableOpacity
            style={styles.qrBtn}
            onPress={() => navigation.navigate('Tabs', { screen: 'SignAttendance' } as object)}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code-outline" size={18} color="#1D9E75" style={styles.btnIcon} />
            <Text style={styles.qrBtnText}>Mark Attendance with QR</Text>
          </TouchableOpacity>

          {/* Calendar button */}
          <TouchableOpacity style={styles.calendarBtn} onPress={addToCalendar} activeOpacity={0.8}>
            <Ionicons name="calendar-outline" size={18} color="#1D9E75" style={styles.btnIcon} />
            <Text style={styles.calendarBtnText}>Add to Calendar</Text>
          </TouchableOpacity>

          {/* Points label */}
          <View style={styles.pointsRow}>
            <Ionicons name="trophy-outline" size={14} color="#1D9E75" style={styles.pointsIcon} />
            <Text style={styles.pointsLabel}>
              Earn {event.pointsForAttendance} points for attendance
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  backBtn: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#DC2626', marginBottom: 16 },
  errorBackBtn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#1D9E75', borderRadius: 8 },
  errorBackBtnText: { color: '#fff', fontWeight: '600' },
  banner: { width: '100%', height: 220, resizeMode: 'cover' },
  bannerPlaceholder: {
    width: '100%',
    height: 180,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  meta: { fontSize: 14, color: '#6B7280', marginLeft: 8 },
  description: { fontSize: 15, color: '#1A1A1A', lineHeight: 24, marginVertical: 16 },
  speakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
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
  speakerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  speakerAvatarImg: { width: 44, height: 44, borderRadius: 22 },
  speakerAvatarText: { color: '#1D9E75', fontSize: 16, fontWeight: '700' },
  speakerName: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  speakerRole: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  registerBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  registerBtnDone: { backgroundColor: '#E8F7F2' },
  rsvpDoneInner: { flexDirection: 'row', alignItems: 'center' },
  rsvpIcon: { marginRight: 6 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  registerBtnTextDone: { color: '#1D9E75', fontSize: 16, fontWeight: '700' },
  rsvpErrorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  rsvpErrorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 12,
  },
  qrBtnText: { color: '#1D9E75', fontSize: 15, fontWeight: '600' },
  calendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 16,
  },
  calendarBtnText: { color: '#1D9E75', fontSize: 16, fontWeight: '600' },
  btnIcon: { marginRight: 8 },
  pointsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  pointsIcon: { marginRight: 6 },
  pointsLabel: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
  calendarMsgBox: {
    backgroundColor: '#E8F7F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(29, 158, 117, 0.3)',
  },
  calendarMsgText: { color: '#1D9E75', fontSize: 14, textAlign: 'center' },
});
