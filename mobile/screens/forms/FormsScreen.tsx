// /mobile/screens/forms/FormsScreen.tsx
// List of forms assigned to the current member.

import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { get } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { Form, ApiResponse } from '../../../shared/types';

export default function FormsScreen(): React.ReactElement {
  const navigation = useNavigation<{ navigate: (screen: string, params: object) => void }>();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  async function fetchForms(): Promise<void> {
    try {
      const response = await get<ApiResponse<Form[]>>(API_ENDPOINTS.MY_FORMS);
      setForms(response.data);
    } catch {
      setError('Failed to load forms.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color="#1D9E75" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>My Forms</Text>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchForms} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={forms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No forms assigned to you.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const submitted = !!item.submission;
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('FormSubmission', { formId: item.id })}
                activeOpacity={0.85}
              >
                {/* Top row: icon + title */}
                <View style={styles.cardTop}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={submitted ? '#9CA3AF' : '#1D9E75'}
                    style={styles.cardIcon}
                  />
                  <Text style={styles.formTitle} numberOfLines={2}>{item.title}</Text>
                </View>

                {/* Bottom row: status */}
                <View style={styles.cardBottom}>
                  {submitted ? (
                    <View style={styles.submittedRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#1D9E75" />
                      <Text style={styles.submittedText}>
                        Submitted{' '}
                        {new Date(item.submission!.submittedAt).toLocaleDateString('en-AE', {
                          day: 'numeric', month: 'short',
                        })}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.openBtnContainer}>
                      <View style={styles.openBtn}>
                        <Text style={styles.openBtnText}>Open Form</Text>
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  heading: { fontSize: 24, fontWeight: '700', color: '#1A1A1A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: COLORS.error, marginBottom: 12 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1D9E75',
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 16, color: '#9CA3AF', textAlign: 'center' },
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
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  cardIcon: { marginTop: 1 },
  formTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    lineHeight: 22,
  },
  cardBottom: {},
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submittedText: {
    fontSize: 13,
    color: '#1D9E75',
    fontWeight: '500',
  },
  openBtnContainer: {
    alignSelf: 'flex-start',
  },
  openBtn: {
    borderWidth: 1,
    borderColor: '#1D9E75',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  openBtnText: {
    fontSize: 13,
    color: '#1D9E75',
    fontWeight: '600',
  },
});
