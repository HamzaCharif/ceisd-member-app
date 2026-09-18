// /mobile/screens/attendance/ManualOverrideScreen.tsx
// Admin-only screen to manually mark a member as attended for an event.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { get, post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { Event, User, ApiResponse } from '../../../shared/types';

type Props = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'ManualOverride'>;
};

export default function ManualOverrideScreen({ navigation }: Props): React.ReactElement {
  const [members, setMembers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([fetchMembers(), fetchEvents()]).finally(() => setLoading(false));
  }, []);

  async function fetchMembers(): Promise<void> {
    try {
      const response = await get<ApiResponse<User[]>>(API_ENDPOINTS.ADMIN_MEMBERS);
      setMembers(response.data);
    } catch {
      // STUB - replace when Agent 7 is complete
      console.log('[ManualOverride] Admin members endpoint not yet available');
    }
  }

  async function fetchEvents(): Promise<void> {
    try {
      const response = await get<ApiResponse<Event[]>>(API_ENDPOINTS.EVENTS);
      setEvents(response.data);
    } catch {
      Alert.alert('Error', 'Failed to load events.');
    }
  }

  async function handleConfirm(): Promise<void> {
    if (!selectedMemberId || !selectedEventId) {
      Alert.alert('Required', 'Please select both a member and an event.');
      return;
    }
    setSubmitting(true);
    try {
      await post<ApiResponse<unknown>>(API_ENDPOINTS.ATTENDANCE_MANUAL, {
        eventId: selectedEventId,
        userId: selectedMemberId,
      });
      setSuccess(true);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to record attendance';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successText}>Attendance recorded manually.</Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => { setSuccess(false); setSelectedMemberId(''); setSelectedEventId(''); }}
          >
            <Text style={styles.btnText}>Record Another</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
            <Text style={styles.linkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Manual Attendance Override</Text>
        </View>

        <Text style={styles.label}>Select Member</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedMemberId} onValueChange={setSelectedMemberId} style={styles.picker}>
            <Picker.Item label="Select a member..." value="" />
            {members.map((m) => (
              <Picker.Item key={m.id} label={`${m.name} (${m.email})`} value={m.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Select Event</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={selectedEventId} onValueChange={setSelectedEventId} style={styles.picker}>
            <Picker.Item label="Select an event..." value="" />
            {events.map((e) => (
              <Picker.Item
                key={e.id}
                label={`${e.title} — ${new Date(e.dateTime).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}`}
                value={e.id}
              />
            ))}
          </Picker>
        </View>

        <TouchableOpacity
          style={[styles.btn, submitting && styles.btnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Confirm Manual Attendance</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  inner: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  heading: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8, marginTop: 16 },
  pickerWrap: { backgroundColor: COLORS.cardBackground, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  picker: { height: 52, color: COLORS.textPrimary },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  successIcon: { fontSize: 64, marginBottom: 16 },
  successText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 24 },
  linkText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
