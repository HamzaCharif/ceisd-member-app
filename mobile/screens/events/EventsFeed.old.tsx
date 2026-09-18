// /mobile/screens/events/EventsFeed.tsx
// Scrollable FlatList of EventCard components.
// Fetches from GET /api/content/events (or ranked events from Agent 5 if available).

import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { get } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { Event, ApiResponse } from '../../../shared/types';
import EventCard from './EventCard';

export default function EventsFeed(): React.ReactElement {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      // Try personalised ranked events first (Agent 5 endpoint — stub until Agent 5 is complete)
      // STUB - replace when Agent 5 is complete
      const response = await get<ApiResponse<Event[]>>(API_ENDPOINTS.EVENTS);
      setEvents(response.data);
    } catch {
      setError('Failed to load events.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 24 }} color={COLORS.primary} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchEvents} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      horizontal={false}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>No upcoming events.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <EventCard event={item} onRsvpChanged={fetchEvents} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 12 },
  center: { padding: 24, alignItems: 'center' },
  errorText: { fontSize: 14, color: COLORS.error, marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});
