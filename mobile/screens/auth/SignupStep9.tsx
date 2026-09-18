// /mobile/screens/auth/SignupStep9.tsx
// Section 9 — Commitment: slider 1–10, final submit button.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../../../shared/constants';
import { SignupFormSection9 } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection9>;
  onSubmit: (data: SignupFormSection9) => void;
  loading: boolean;
}

const COMMITMENT_LABELS: Record<number, string> = {
  1: 'Minimal — I will check in occasionally',
  2: 'Very low',
  3: 'Low',
  4: 'Moderate',
  5: 'Active',
  6: 'Engaged',
  7: 'Highly engaged',
  8: 'Very committed',
  9: 'Fully dedicated',
  10: 'Maximum — This is a top priority for me',
};

export default function SignupStep9({ data, onSubmit, loading }: Props): React.ReactElement {
  const [commitmentScore, setCommitmentScore] = useState(data?.commitmentScore ?? 7);

  function handleSubmit(): void {
    onSubmit({ commitmentScore });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Commitment Level</Text>
      <Text style={styles.statement}>
        "I intend to actively participate in CEISD activities this semester."
      </Text>

      <View style={styles.sliderContainer}>
        <Text style={styles.scoreLabel}>{commitmentScore}</Text>
        <Text style={styles.scoreDescription}>{COMMITMENT_LABELS[commitmentScore]}</Text>

        <Slider
          style={styles.slider}
          minimumValue={1}
          maximumValue={10}
          step={1}
          value={commitmentScore}
          onValueChange={(v) => setCommitmentScore(Math.round(v))}
          minimumTrackTintColor="#1D9E75"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#1D9E75"
        />

        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>1</Text>
          <Text style={styles.sliderLabelText}>5</Text>
          <Text style={styles.sliderLabelText}>10</Text>
        </View>
      </View>

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Almost done!</Text>
        <Text style={styles.summaryText}>
          You've completed all 9 sections of your CEISD profile. Submit to join the community and start your entrepreneurial journey.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Complete Profile &amp; Join CEISD</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 12 },
  statement: { fontSize: 15, color: '#6B7280', fontStyle: 'italic', lineHeight: 24, marginBottom: 40 },
  sliderContainer: { alignItems: 'center', marginBottom: 40 },
  scoreLabel: { fontSize: 64, fontWeight: '700', color: '#1D9E75' },
  scoreDescription: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: 8 },
  sliderLabelText: { fontSize: 13, color: '#6B7280' },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  summaryText: { fontSize: 15, color: '#1A1A1A', lineHeight: 22 },
  button: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
