// /mobile/screens/forms/FormSubmissionScreen.tsx
// Renders a dynamic form and handles submission.

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { get, post } from '../../../shared/api-client';
import { API_ENDPOINTS } from '../../../shared/constants';
import { Form, ApiResponse } from '../../../shared/types';
import DynamicFormRenderer from './DynamicFormRenderer';

type Props = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'FormSubmission'>;
  route: RouteProp<{ FormSubmission: { formId: string } }, 'FormSubmission'>;
};

export default function FormSubmissionScreen({ navigation, route }: Props): React.ReactElement {
  const { formId } = route.params;
  const [form, setForm] = useState<Form | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  async function fetchForm(): Promise<void> {
    try {
      const response = await get<ApiResponse<Form>>(API_ENDPOINTS.FORM(formId));
      // Normalize schema: Prisma returns schema as a raw FormField[] array,
      // but FormSchema type expects { fields: FormField[] }.
      const rawForm = response.data as unknown as { schema: unknown } & typeof response.data;
      if (Array.isArray(rawForm.schema)) {
        rawForm.schema = { fields: rawForm.schema } as import('../../../shared/types').FormSchema;
      }
      const formData = rawForm as Form;
      setForm(formData);
      if (response.data.submission?.answers) {
        setValues(response.data.submission.answers as Record<string, unknown>);
      }
    } catch {
      setErrorMsg('Failed to load form.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!form) return;
    setErrorMsg(null);

    const missing = form.schema.fields.filter(
      (f) => f.required && (values[f.id] === undefined || values[f.id] === '' || values[f.id] === null)
    );
    if (missing.length > 0) {
      setErrorMsg(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      await post<ApiResponse<unknown>>(API_ENDPOINTS.FORM_SUBMIT(formId), { answers: values });
      setSubmitted(true);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to submit form.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFieldChange(fieldId: string, value: unknown): void {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={styles.center} color="#1D9E75" />
      </SafeAreaView>
    );
  }

  if (!form) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.submittedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#1D9E75" />
            <Text style={styles.submittedText}>Form submitted successfully!</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.submitBtn}>
            <Text style={styles.submitBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const alreadySubmitted = !!form.submission;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={2}>{form.title}</Text>
        </View>

        {alreadySubmitted && (
          <View style={styles.submittedBanner}>
            <Ionicons name="checkmark-circle" size={20} color="#1D9E75" />
            <Text style={styles.submittedText}>
              Already submitted on{' '}
              {new Date(form.submission!.submittedAt).toLocaleDateString('en-AE', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </Text>
          </View>
        )}

        {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

        {/* Dynamic form */}
        <DynamicFormRenderer
          schema={form.schema}
          values={values}
          onChange={handleFieldChange}
        />

        {/* Submit button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{alreadySubmitted ? 'Resubmit' : 'Submit'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  inner: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {},
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  submittedBanner: {
    backgroundColor: '#E8F7F2',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  submittedText: {
    color: '#1D9E75',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 12,
    textAlign: 'center',
  },
});
