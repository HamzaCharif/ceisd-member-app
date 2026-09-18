// /mobile/screens/tasks/TaskCard.tsx
// Single task card — shows title, type badge, deadline, status indicator.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, TASK_TYPE_COLORS, POINT_VALUES } from '../../../shared/constants';
import { Task, TaskStatus, CompletionMethod } from '../../../shared/types';

interface Props {
  task: Task;
}

function deadlineLabel(deadline: string): { text: string; color: string } {
  const now = new Date();
  const due = new Date(deadline);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { text: 'Overdue', color: COLORS.error };
  if (diffDays === 0) return { text: 'Due today', color: '#F59E0B' };
  if (diffDays === 1) return { text: '1 day left', color: '#F59E0B' };
  return { text: `${diffDays} days left`, color: COLORS.textSecondary };
}

const TYPE_BADGE_BG: Record<string, string> = {
  WORKSHOP: '#EEF0FF',
  FORM: '#E8F2FF',
  SUBMISSION: '#FEF6E8',
  MEETING: '#FDF0EC',
};

export default function TaskCard({ task }: Props): React.ReactElement {
  const navigation = useNavigation<{ navigate: (screen: string, params: object) => void }>();
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const dlLabel = deadlineLabel(task.deadline);
  const badgeColor = TASK_TYPE_COLORS[task.type] ?? COLORS.primary;
  const badgeBg = TYPE_BADGE_BG[task.type] ?? '#F3F4F6';
  const pts = task.completionMethod === CompletionMethod.FORM_SUBMISSION
    ? POINT_VALUES.TASK_RECOMMENDED
    : POINT_VALUES.TASK_MANDATORY;

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: badgeColor }]}
      onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
      activeOpacity={0.85}
    >
      {/* Top row: type badge, status badge, points */}
      <View style={styles.row}>
        <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.typeBadgeText, { color: badgeColor }]}>{task.type}</Text>
        </View>

        <View style={[styles.statusBadge, isCompleted ? styles.statusBadgeDone : styles.statusBadgePending]}>
          <Text style={[styles.statusBadgeText, isCompleted ? styles.statusTextDone : styles.statusTextPending]}>
            {isCompleted ? 'COMPLETED' : 'PENDING'}
          </Text>
        </View>

        <Text style={styles.ptsLabel}>{pts} pts</Text>
      </View>

      {/* Title */}
      <Text
        style={[styles.title, isCompleted && styles.titleCompleted]}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Description snippet */}
      {!!task.description && (
        <Text style={styles.description} numberOfLines={2}>
          {task.description.slice(0, 100)}{task.description.length > 100 ? '...' : ''}
        </Text>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.deadlineRow}>
          <Ionicons name="time-outline" size={13} color="#6B7280" />
          <Text style={[styles.deadlineText, { color: dlLabel.color }]}>{dlLabel.text}</Text>
        </View>
        {isCompleted && task.completion && (
          <Text style={styles.completedDate}>
            Done {new Date(task.completion.completedAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short' })}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeDone: { backgroundColor: '#E8F7F2' },
  statusBadgePending: { backgroundColor: '#FEF9E7' },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextDone: { color: '#1D9E75' },
  statusTextPending: { color: '#F59E0B' },
  ptsLabel: {
    marginLeft: 'auto' as unknown as number,
    fontSize: 12,
    color: '#1D9E75',
    fontWeight: '600',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 13,
    marginLeft: 4,
  },
  completedDate: {
    fontSize: 12,
    color: '#1D9E75',
  },
});
