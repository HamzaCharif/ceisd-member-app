// /mobile/screens/tasks/TaskDetailScreen.tsx
// Task detail view — shows description, deadline, completion method, and action button.

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { get, patch } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS, TASK_TYPE_COLORS } from '../../../shared/constants';
import { Task, CompletionMethod, TaskStatus, ApiResponse } from '../../../shared/types';

type Props = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'TaskDetail'>;
  route: RouteProp<{ TaskDetail: { taskId: string } }, 'TaskDetail'>;
};

const TYPE_BADGE_BG: Record<string, string> = {
  WORKSHOP: '#EEF0FF',
  FORM: '#E8F2FF',
  SUBMISSION: '#FEF6E8',
  MEETING: '#FDF0EC',
};

export default function TaskDetailScreen({ navigation, route }: Props): React.ReactElement {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  async function fetchTask(): Promise<void> {
    try {
      const response = await get<ApiResponse<Task>>(API_ENDPOINTS.TASK(taskId));
      setTask(response.data);
    } catch {
      setErrorMsg('Failed to load task details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleManualComplete(): Promise<void> {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await patch<ApiResponse<unknown>>(API_ENDPOINTS.TASK_COMPLETE(taskId), {});
      setSuccessMsg('Your completion request has been sent for admin approval.');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchTask();
    } catch {
      setErrorMsg('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color="#1D9E75" />
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          {errorMsg && <Text style={styles.errorInline}>{errorMsg}</Text>}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const badgeColor = TASK_TYPE_COLORS[task.type] ?? COLORS.primary;
  const badgeBg = TYPE_BADGE_BG[task.type] ?? '#F3F4F6';

  const dueDate = new Date(task.deadline).toLocaleDateString('en-AE', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        {/* Error message */}
        {errorMsg && <Text style={styles.errorInline}>{errorMsg}</Text>}

        {/* Success banner */}
        {successMsg && (
          <View style={styles.successBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />
            <Text style={styles.successBannerText}>{successMsg}</Text>
          </View>
        )}

        {/* Completed banner */}
        {isCompleted && task.completion && (
          <View style={styles.completedBanner}>
            <Ionicons name="checkmark-circle" size={18} color="#1D9E75" />
            <Text style={styles.completedBannerText}>
              Completed on{' '}
              {new Date(task.completion.completedAt).toLocaleDateString('en-AE', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Type badge */}
        <View style={[styles.badge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{task.type}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{task.title}</Text>

        {/* Deadline */}
        <View style={styles.deadlineRow}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.deadlineText}>Due: {dueDate}</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>{task.description}</Text>

        {/* Completion method */}
        {!isCompleted && (
          <View style={styles.methodBox}>
            {task.completionMethod === CompletionMethod.AUTO_ATTENDANCE && (
              <View style={styles.methodTextRow}>
                <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
                <Text style={styles.methodText}>
                  This task will be completed automatically when you attend{' '}
                  {task.linkedEvent?.title ? `"${task.linkedEvent.title}"` : 'the linked event'}.
                </Text>
              </View>
            )}
            {task.completionMethod === CompletionMethod.FORM_SUBMISSION && (
              <>
                <View style={styles.methodTextRow}>
                  <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                  <Text style={styles.methodText}>Submit the form below to complete this task.</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('FormSubmission', { formId: taskId })}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionBtnText}>Open Form</Text>
                </TouchableOpacity>
              </>
            )}
            {task.completionMethod === CompletionMethod.MANUAL_APPROVAL && (
              <>
                <View style={styles.methodTextRow}>
                  <Ionicons name="cloud-upload-outline" size={16} color="#6B7280" />
                  <Text style={styles.methodText}>Submit your work and await admin approval.</Text>
                </View>
                <TouchableOpacity
                  style={[styles.actionBtn, submitting && styles.actionBtnDisabled]}
                  onPress={handleManualComplete}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionBtnText}>Submit for Approval</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { padding: 20, paddingBottom: 48 },
  back: { marginBottom: 16 },
  completedBanner: {
    backgroundColor: '#E8F7F2',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  completedBannerText: {
    color: '#1D9E75',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    backgroundColor: '#E8F7F2',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  successBannerText: {
    color: '#1D9E75',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  deadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  deadlineText: { fontSize: 14, color: '#6B7280', marginLeft: 4 },
  description: { fontSize: 15, color: '#1A1A1A', lineHeight: 24, marginBottom: 24 },
  methodBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  methodTextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  methodText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    flex: 1,
  },
  actionBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  errorInline: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
});
