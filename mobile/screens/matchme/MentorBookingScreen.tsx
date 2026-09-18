// /mobile/screens/matchme/MentorBookingScreen.tsx
// Mentor booking screen — AI recommends mentors, member can book a session.

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { get, post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { ApiResponse } from '../../../shared/types';

interface MentorRecommendation {
  id: string;
  name: string;
  email: string;
  college?: string;
  stage?: string;
  compatibilityScore: number;
  explanation: string;
}

export default function MentorBookingScreen(): React.ReactElement {
  const navigation = useNavigation<{ goBack: () => void }>();
  const [mentors, setMentors] = useState<MentorRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingMentorId, setBookingMentorId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  async function fetchMentors(): Promise<void> {
    try {
      const response = await get<ApiResponse<{ mentors: MentorRecommendation[] }>>(
        API_ENDPOINTS.MATCHING_RECOMMEND_MENTOR
      );
      setMentors(response.data.mentors);
    } catch {
      // show empty state
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(mentorId: string): Promise<void> {
    setErrorMsg(null);
    if (!notes.trim()) {
      setErrorMsg('Please add a short note about what you want to discuss.');
      return;
    }
    setSubmitting(true);
    try {
      await post<ApiResponse<unknown>>(API_ENDPOINTS.MATCHING_BOOK_MENTOR, { mentorId, notes });
      setBooked(mentorId);
      setBookingMentorId(null);
      setNotes('');
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to book session';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const mentorInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.heading}>Book a Mentor</Text>
            <Text style={styles.subheading}>AI recommends based on your profile</Text>
          </View>
        </View>

        {mentors.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>No mentors available yet</Text>
            <Text style={styles.emptyText}>Check back as more faculty and senior members join CEISD.</Text>
          </View>
        ) : (
          mentors.map((mentor) => (
            <View key={mentor.id} style={styles.mentorCard}>
              {/* Avatar + info */}
              <View style={styles.mentorHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{mentorInitials(mentor.name)}</Text>
                </View>
                <View style={styles.mentorInfo}>
                  <Text style={styles.mentorName}>{mentor.name}</Text>
                  <Text style={styles.mentorRole}>{mentor.stage ?? 'Mentor'} · {mentor.college ?? 'AUS'}</Text>
                </View>
                <Text style={styles.matchScore}>{Math.round(mentor.compatibilityScore)}%</Text>
              </View>

              <Text style={styles.explanation}>{mentor.explanation}</Text>

              {/* Already booked */}
              {booked === mentor.id ? (
                <View style={styles.bookedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#1D9E75" style={{ marginRight: 8 }} />
                  <Text style={styles.bookedText}>Booking request sent!</Text>
                </View>
              ) : bookingMentorId === mentor.id ? (
                <>
                  {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
                  <TextInput
                    style={styles.notesInput}
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="What would you like to discuss?"
                    placeholderTextColor={COLORS.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                  <View style={styles.bookActions}>
                    <TouchableOpacity
                      style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
                      onPress={() => handleBook(mentor.id)}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.confirmBtnText}>Confirm Booking</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setBookingMentorId(null)} style={styles.cancelBtn}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.bookBtn}
                  onPress={() => setBookingMentorId(mentor.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.bookBtnText}>Book Session</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { padding: 4 },
  heading: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  subheading: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  mentorCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16,
    ...Platform.select({
      native: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      web: { boxShadow: '0px 1px 4px rgba(0,0,0,0.06)' },
    }),
  },
  mentorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#1A2744', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  mentorInfo: { flex: 1 },
  mentorName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  mentorRole: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  matchScore: { fontSize: 18, fontWeight: '700', color: '#1D9E75' },
  explanation: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', lineHeight: 19, marginBottom: 14 },
  bookBtn: { backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  notesInput: {
    backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#E5E7EB', fontSize: 14, color: '#1A1A1A',
    minHeight: 80, marginBottom: 12,
  },
  bookActions: { flexDirection: 'row', gap: 10 },
  confirmBtn: { flex: 2, backgroundColor: '#1D9E75', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cancelBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#6B7280', fontSize: 14 },
  bookedBadge: {
    backgroundColor: '#E8F7F2', borderRadius: 10, padding: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  bookedText: { color: '#1D9E75', fontWeight: '600', fontSize: 14 },
  errorText: { fontSize: 13, color: '#DC2626', marginBottom: 8 },
});
