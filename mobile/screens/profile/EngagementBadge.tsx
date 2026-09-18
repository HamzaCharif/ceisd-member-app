// /mobile/screens/profile/EngagementBadge.tsx
// Pill badge displaying the user's engagement level label.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  level: string;
}

function getBadgeColor(level: string): string {
  const lower = level.toLowerCase();
  if (lower.includes('high')) return '#1D9E75';
  if (lower.includes('medium') || lower.includes('mid')) return '#378ADD';
  return '#6B7280';
}

export default function EngagementBadge({ level }: Props): React.ReactElement {
  const backgroundColor = getBadgeColor(level);
  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
