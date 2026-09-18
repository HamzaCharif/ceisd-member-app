// /mobile/screens/events/EventsFeed.tsx
// Events feed — spec §5.2. Sprint 2 upgrade: pull-to-refresh, skeleton-free
// loading state, proper EmptyState. Fetch logic unchanged.

import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, ActivityIndicator, RefreshControl, View } from 'react-native';
import { get } from '../../../shared/api-client';
import { API_ENDPOINTS } from '../../../shared/constants';
import { Event, ApiResponse } from '../../../shared/types';
import { colors, spacing } from '../../theme/theme';
import { Button, EmptyState } from '../../components';
import EventCard from './EventCard';

export default function EventsFeed(): React.ReactElement {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (isRefresh = false): Promise<void> => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Couldn't load events"
        message="Check your connection and try again."
        action={<Button title="Retry" size="sm" fullWidth={false} onPress={() => fetchEvents()} />}
      />
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchEvents(true)}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="calendar-outline"
          title="No upcoming events"
          message="New CEISD events will appear here — check back soon."
        />
      }
      renderItem={({ item }) => <EventCard event={item} onRsvpChanged={() => fetchEvents(true)} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.md, paddingTop: spacing.xs },
  loadingWrap: { paddingVertical: spacing.xl, alignItems: 'center' },
});
