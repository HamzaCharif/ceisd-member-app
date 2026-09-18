// /mobile/screens/auth/SignupForm.tsx
// Multi-step signup form container (9 sections).
// Manages step state, progress bar, and final submission.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { SignupFormData, ApiResponse } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';

import SignupStep1 from './SignupStep1';
import SignupStep2 from './SignupStep2';
import SignupStep3 from './SignupStep3';
import SignupStep4 from './SignupStep4';
import SignupStep5 from './SignupStep5';
import SignupStep6 from './SignupStep6';
import SignupStep7 from './SignupStep7';
import SignupStep8 from './SignupStep8';
import SignupStep9 from './SignupStep9';

const TOTAL_STEPS = 9;

type SignupFormProps = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'SignupForm'>;
  route: { params?: { prefillEmail?: string; prefillName?: string } };
};

const STEP_TITLES: Record<number, string> = {
  1: 'Identity',
  2: 'Motivation',
  3: 'Skills',
  4: 'Interests',
  5: 'Founder Readiness',
  6: 'Collaboration',
  7: 'Engagement',
  8: 'AI Profile',
  9: 'Commitment',
};

export default function SignupForm({ navigation, route }: SignupFormProps): React.ReactElement {
  const { setIsAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SignupFormData>>({});

  const prefillEmail = route.params?.prefillEmail ?? '';
  const prefillName = route.params?.prefillName ?? '';

  function updateSection<K extends keyof SignupFormData>(key: K, value: SignupFormData[K]): void {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function goNext(): void {
    if (currentStep < TOTAL_STEPS) setCurrentStep((s) => s + 1);
  }

  function goBack(): void {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    else navigation.goBack();
  }

  async function handleSubmit(finalSection9?: import('../../../shared/types').SignupFormSection9): Promise<void> {
    const complete = { ...formData, ...(finalSection9 ? { section9: finalSection9 } : {}) } as SignupFormData;
    setErrorMsg(null);
    setLoading(true);
    try {
      await post<ApiResponse<unknown>>(API_ENDPOINTS.AUTH_COMPLETE_PROFILE, complete);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to save profile. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  const progress = currentStep / TOTAL_STEPS;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>
          Step {currentStep} of {TOTAL_STEPS} — {STEP_TITLES[currentStep]}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      {/* Step content */}
      <View style={styles.stepContent}>
        {currentStep === 1 && (
          <SignupStep1
            data={formData.section1}
            prefillEmail={prefillEmail}
            prefillName={prefillName}
            onNext={(data) => { updateSection('section1', data); goNext(); }}
          />
        )}
        {currentStep === 2 && (
          <SignupStep2
            data={formData.section2}
            onNext={(data) => { updateSection('section2', data); goNext(); }}
          />
        )}
        {currentStep === 3 && (
          <SignupStep3
            data={formData.section3}
            onNext={(data) => { updateSection('section3', data); goNext(); }}
          />
        )}
        {currentStep === 4 && (
          <SignupStep4
            data={formData.section4}
            onNext={(data) => { updateSection('section4', data); goNext(); }}
          />
        )}
        {currentStep === 5 && (
          <SignupStep5
            data={formData.section5}
            onNext={(data) => { updateSection('section5', data); goNext(); }}
          />
        )}
        {currentStep === 6 && (
          <SignupStep6
            data={formData.section6}
            onNext={(data) => { updateSection('section6', data); goNext(); }}
          />
        )}
        {currentStep === 7 && (
          <SignupStep7
            data={formData.section7}
            onNext={(data) => { updateSection('section7', data); goNext(); }}
          />
        )}
        {currentStep === 8 && (
          <SignupStep8
            data={formData.section8}
            onNext={(data) => { updateSection('section8', data); goNext(); }}
          />
        )}
        {currentStep === 9 && (
          <SignupStep9
            data={formData.section9}
            onSubmit={(data) => { updateSection('section9', data); handleSubmit(data); }}
            loading={loading}
          />
        )}
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{errorMsg}</Text>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stepTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#6B7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
    borderRadius: 2,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1D9E75',
    borderRadius: 2,
  },
  stepContent: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
  },
  errorBoxText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
});
