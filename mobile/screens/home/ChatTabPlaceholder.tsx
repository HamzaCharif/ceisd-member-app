// /mobile/screens/home/ChatTabPlaceholder.tsx
// Chat tab placeholder — marked as Phase 2 optional, not implemented per spec.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../../shared/constants';

export default function ChatTabPlaceholder(): React.ReactElement {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>💬</Text>
      <Text style={styles.title}>Chat coming soon</Text>
      <Text style={styles.subtitle}>
        Real-time messaging will be available in a future update.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
});
