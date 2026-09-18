// /mobile/screens/home/AnnouncementsTab.tsx
// Displays admin-posted announcements. Read-only for members.
// Fetches from GET /api/content/announcements.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Platform,
} from 'react-native';
import { get } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { Announcement, ApiResponse } from '../../../shared/types';

export default function AnnouncementsTab(): React.ReactElement {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements(): Promise<void> {
    try {
      const response = await get<ApiResponse<Announcement[]>>(API_ENDPOINTS.ANNOUNCEMENTS);
      setAnnouncements(response.data);
    } catch {
      setError('Failed to load announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCTA(item: Announcement): void {
    if (item.ctaUrl) {
      Linking.openURL(item.ctaUrl).catch(() => {/* ignore */});
    }
  }

  if (loading) {
    return <ActivityIndicator style={styles.center} color={COLORS.primary} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchAnnouncements} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (announcements.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No announcements yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={announcements}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {/* Category badge */}
          <View style={styles.tagBadge}>
            <Text style={styles.tagText}>{item.categoryTag}</Text>
          </View>
          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>
          {/* Description */}
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          {/* Date */}
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleDateString('en-AE', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
          {/* CTA link */}
          <TouchableOpacity
            onPress={() => handleCTA(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.ctaText}>{item.ctaLabel}</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#DC2626', textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#1D9E75', borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#6B7280' },
  list: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
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
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F7F2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  tagText: { color: '#1D9E75', fontSize: 11, fontWeight: '600' },
  title: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  description: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  date: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  ctaText: { fontSize: 13, color: '#1D9E75', fontWeight: '600' },
});
