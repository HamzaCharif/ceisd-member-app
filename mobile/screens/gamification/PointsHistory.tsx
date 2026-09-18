// /mobile/screens/gamification/PointsHistory.tsx
// Points history screen — lists all GamificationRecord entries for the current user.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, TouchableOpacity, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { get } from '../../../shared/api-client';
import { COLORS } from '../../../shared/constants';
import { GamificationRecord, ApiResponse } from '../../../shared/types';

const REASON_LABELS: Record<string, string> = {
  ATTENDANCE: 'Event attendance',
  TASK_MANDATORY: 'Mandatory task completed',
  TASK_RECOMMENDED: 'Recommended task completed',
  NOTICE_POST: 'Notice board post created',
  MATCH_ACCEPTED: 'Match accepted',
  FORM_SUBMITTED: 'Form submitted',
};

export default function PointsHistory(): React.ReactElement {
  const navigation = useNavigation<{ goBack: () => void }>();
  const [records, setRecords] = useState<GamificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory(): Promise<void> {
    try {
      // Points history endpoint — fetches from gamification records for current user
      const response = await get<ApiResponse<{ records: GamificationRecord[]; total: number }>>(
        '/api/gamification/my-history'
      );
      setRecords(response.data.records);
      setTotal(response.data.total);
    } catch {
      // fail silently
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.heading}>Points History</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Total card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalValue}>{total}</Text>
        <Text style={styles.totalLabel}>Total Points</Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={64} color="#D1D5DB" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyText}>No points earned yet. Start attending events!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Ionicons name="star-outline" size={20} color="#1D9E75" style={{ marginRight: 12 }} />
            <View style={styles.rowLeft}>
              <Text style={styles.reason}>{REASON_LABELS[item.reason] ?? item.reason}</Text>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('en-AE', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </Text>
            </View>
            <Text style={styles.points}>+{item.points}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backBtn: { width: 32 },
  heading: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  totalCard: {
    backgroundColor: '#1D9E75', margin: 16, borderRadius: 16, padding: 24, alignItems: 'center',
  },
  totalValue: { fontSize: 48, fontWeight: '700', color: '#fff' },
  totalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8,
    ...Platform.select({
      native: { elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
      web: { boxShadow: '0px 1px 3px rgba(0,0,0,0.04)' },
    }),
  },
  rowLeft: { flex: 1 },
  reason: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 3 },
  date: { fontSize: 12, color: '#6B7280' },
  points: { fontSize: 18, fontWeight: '700', color: '#1D9E75' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
