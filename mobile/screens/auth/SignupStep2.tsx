// /mobile/screens/auth/SignupStep2.tsx
// Section 2 — Motivation: why joining (multi-select, max 2) + current stage (single-select).

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, WHY_JOINING_OPTIONS, CURRENT_STAGE_OPTIONS } from '../../../shared/constants';
import { SignupFormSection2 } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection2>;
  onNext: (data: SignupFormSection2) => void;
}

export default function SignupStep2({ data, onNext }: Props): React.ReactElement {
  const [whyJoining, setWhyJoining] = useState<string[]>(data?.whyJoining ?? []);
  const [currentStage, setCurrentStage] = useState(data?.currentStage ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function toggleWhyJoining(option: string): void {
    setWhyJoining((prev) => {
      if (prev.includes(option)) return prev.filter((x) => x !== option);
      if (prev.length >= 2) { setErrorMsg('You can select up to 2 reasons.'); return prev; }
      return [...prev, option];
    });
  }

  function handleNext(): void {
    if (whyJoining.length === 0 || !currentStage) {
      setErrorMsg('Please answer both questions before continuing.');
      return;
    }
    setErrorMsg(null);
    onNext({ whyJoining, currentStage });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Why are you joining CEISD?</Text>
      <Text style={styles.hint}>Select up to 2</Text>
      <View style={styles.chips}>
        {WHY_JOINING_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, whyJoining.includes(option) && styles.chipActive]}
            onPress={() => toggleWhyJoining(option)}
          >
            <Text style={[styles.chipText, whyJoining.includes(option) && styles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.title, { marginTop: 32 }]}>Which describes you best?</Text>
      <View style={styles.chips}>
        {CURRENT_STAGE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, currentStage === option && styles.chipActive]}
            onPress={() => setCurrentStage(option)}
          >
            <Text style={[styles.chipText, currentStage === option && styles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  hint: { fontSize: 13, color: '#6B7280', marginBottom: 16 },
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
