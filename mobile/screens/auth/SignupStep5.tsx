// /mobile/screens/auth/SignupStep5.tsx
// Section 5 — Founder Readiness: past experiences (multi-select), time commitment, risk tolerance.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, PAST_EXPERIENCES, TIME_COMMITMENTS, RISK_TOLERANCE_OPTIONS } from '../../../shared/constants';
import { SignupFormSection5 } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection5>;
  onNext: (data: SignupFormSection5) => void;
}

export default function SignupStep5({ data, onNext }: Props): React.ReactElement {
  const [pastExperiences, setPastExperiences] = useState<string[]>(data?.pastExperiences ?? []);
  const [timeCommitment, setTimeCommitment] = useState(data?.timeCommitment ?? '');
  const [riskTolerance, setRiskTolerance] = useState(data?.riskTolerance ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function toggleExp(exp: string): void {
    setPastExperiences((prev) => prev.includes(exp) ? prev.filter((x) => x !== exp) : [...prev, exp]);
  }

  function handleNext(): void {
    if (!timeCommitment || !riskTolerance) {
      setErrorMsg('Please answer all questions before continuing.');
      return;
    }
    setErrorMsg(null);
    onNext({ pastExperiences, timeCommitment, riskTolerance });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Founder Readiness</Text>

      <Text style={styles.subtitle}>Past experiences (select all that apply)</Text>
      <View style={styles.chips}>
        {PAST_EXPERIENCES.map((exp) => (
          <TouchableOpacity
            key={exp}
            style={[styles.chip, pastExperiences.includes(exp) && styles.chipActive]}
            onPress={() => toggleExp(exp)}
          >
            <Text style={[styles.chipText, pastExperiences.includes(exp) && styles.chipTextActive]}>{exp}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.subtitle, { marginTop: 24 }]}>Weekly time commitment</Text>
      {TIME_COMMITMENTS.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.radioRow, timeCommitment === opt && styles.radioRowActive]}
          onPress={() => setTimeCommitment(opt)}
        >
          <Text style={styles.radioText}>{opt}</Text>
          <View style={[styles.radioCircle, timeCommitment === opt && styles.radioCircleFilled]} />
        </TouchableOpacity>
      ))}

      <Text style={[styles.subtitle, { marginTop: 24 }]}>Risk tolerance</Text>
      {RISK_TOLERANCE_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.radioRow, riskTolerance === opt && styles.radioRowActive]}
          onPress={() => setRiskTolerance(opt)}
        >
          <Text style={styles.radioText}>{opt}</Text>
          <View style={[styles.radioCircle, riskTolerance === opt && styles.radioCircleFilled]} />
        </TouchableOpacity>
      ))}

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F5F5F5',
    marginBottom: 4,
  },
  chipActive: { backgroundColor: '#E8F7F2', borderColor: '#1D9E75' },
  chipText: { fontSize: 13, color: '#6B7280' },
  chipTextActive: { color: '#1D9E75', fontWeight: '600' },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  radioRowActive: { borderColor: '#1D9E75' },
  radioText: { fontSize: 15, color: '#1A1A1A', flex: 1 },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioCircleFilled: {
    backgroundColor: '#1D9E75',
    borderColor: '#1D9E75',
  },
  button: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  errorText: { color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' },
});
