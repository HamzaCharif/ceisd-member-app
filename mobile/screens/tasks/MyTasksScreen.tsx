// /mobile/screens/tasks/MyTasksScreen.tsx
// My Tasks screen — three segmented sections: Mandatory, Recommended, Completed.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { get } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { Task, TaskType, TaskStatus, ApiResponse } from '../../../shared/types';
import TaskCard from './TaskCard';

type Section = 'mandatory' | 'recommended' | 'completed';

const SECTIONS: Array<{ id: Section; label: string }> = [
  { id: 'mandatory', label: 'Mandatory' },
  { id: 'recommended', label: 'Recommended' },
  { id: 'completed', label: 'Completed' },
];

export default function MyTasksScreen(): React.ReactElement {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('mandatory');

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks(): Promise<void> {
    try {
      const response = await get<ApiResponse<Task[]>>(API_ENDPOINTS.MY_TASKS);
      setTasks(response.data);
    } catch {
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const mandatoryTypes: TaskType[] = [TaskType.WORKSHOP, TaskType.MEETING];
  const pending = tasks.filter((t) => t.status === TaskStatus.PENDING);
  const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED);

  const sections: Record<Section, Task[]> = {
    mandatory: pending.filter((t) => mandatoryTypes.includes(t.type)),
    recommended: pending.filter((t) => !mandatoryTypes.includes(t.type)),
    completed,
  };

  const visibleTasks = sections[activeSection];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color="#1D9E75" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Tasks</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chipsScroll}
      >
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => setActiveSection(s.id)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {s.label}
                {sections[s.id].length > 0 ? ` (${sections[s.id].length})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Task list or error */}
      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchTasks} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {visibleTasks.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No tasks yet</Text>
            </View>
          ) : (
            visibleTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  chipsScroll: { flexGrow: 0 },
  chipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipActive: {
    backgroundColor: '#E8F7F2',
    borderColor: '#1D9E75',
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '400',
  },
  chipTextActive: {
    color: '#1D9E75',
    fontWeight: '600',
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 16, color: '#9CA3AF' },
  errorText: { fontSize: 14, color: COLORS.error, marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1D9E75',
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
