// /mobile/screens/attendance/AttendanceSuccessScreen.tsx
// Success screen shown after attendance is confirmed.

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../../shared/constants';

type Props = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'AttendanceSuccess'>;
  route: RouteProp<{ AttendanceSuccess: { eventTitle: string; pointsEarned: number } }, 'AttendanceSuccess'>;
};

export default function AttendanceSuccessScreen({ navigation, route }: Props): React.ReactElement {
  const { eventTitle, pointsEarned } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => navigation.navigate('Tabs' as never), 4000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Success circle */}
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={56} color="#1D9E75" />
        </View>

        <Text style={styles.title}>Attendance Recorded!</Text>
        <Text style={styles.eventName}>{eventTitle}</Text>

        {/* Points badge */}
        <View style={styles.pointsBadge}>
          <View style={styles.pointsRow}>
            <Ionicons name="trophy-outline" size={18} color="#1D9E75" style={{ marginRight: 8 }} />
            <Text style={styles.pointsText}>+{pointsEarned} points earned</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Your attendance has been confirmed. Keep engaging to earn more points and advance your journey!
        </Text>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Tabs' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#E8F7F2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  eventName: { fontSize: 16, color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  pointsBadge: {
    backgroundColor: '#E8F7F2', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginBottom: 24,
  },
  pointsRow: { flexDirection: 'row', alignItems: 'center' },
  pointsText: { fontSize: 18, fontWeight: '700', color: '#1D9E75' },
  subtitle: {
    fontSize: 14, color: '#6B7280', textAlign: 'center',
    lineHeight: 22, marginBottom: 40,
  },
  homeBtn: {
    width: '100%', backgroundColor: '#1D9E75', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
