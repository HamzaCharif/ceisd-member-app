// /mobile/screens/auth/SignupStep4.tsx
// Section 4 — Problem Interests: industry interests (up to 3) + optional current problem description.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Switch } from 'react-native';
import { COLORS, INDUSTRY_INTERESTS } from '../../../shared/constants';
import { SignupFormSection4 } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection4>;
  onNext: (data: SignupFormSection4) => void;
}

export default function SignupStep4({ data, onNext }: Props): React.ReactElement {
  const [industries, setIndustries] = useState<string[]>(data?.industries ?? []);
  const [workingOnProblem, setWorkingOnProblem] = useState(data?.workingOnProblem ?? false);
  const [currentProblem, setCurrentProblem] = useState(data?.currentProblem ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function toggleIndustry(option: string): void {
    setIndustries((prev) => {
      if (prev.includes(option)) return prev.filter((x) => x !== option);
      if (prev.length >= 3) { setErrorMsg('You can select up to 3 industries.'); return prev; }
      return [...prev, option];
    });
  }

  function handleNext(): void {
    if (industries.length === 0) {
      setErrorMsg('Please select at least one industry interest.');
      return;
    }
    if (workingOnProblem && !currentProblem.trim()) {
      setErrorMsg('Please describe the problem you are working on.');
      return;
    }
    const words = currentProblem.trim().split(/\s+/).length;
    if (workingOnProblem && words > 150) {
      setErrorMsg('Problem description must be 150 words or less.');
      return;
    }
    setErrorMsg(null);
    onNext({ industries, workingOnProblem, currentProblem: workingOnProblem ? currentProblem : undefined });
  }

  const wordCount = currentProblem.trim().split(/\s+/).filter(Boolean).length;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>What problems interest you?</Text>
      <Text style={styles.hint}>Select up to 3 industries</Text>
      <View style={styles.chips}>
        {INDUSTRY_INTERESTS.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, industries.includes(option) && styles.chipActive]}
            onPress={() => toggleIndustry(option)}
          >
            <Text style={[styles.chipText, industries.includes(option) && styles.chipTextActive]}>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Are you working on a problem?</Text>
        <Switch value={workingOnProblem} onValueChange={setWorkingOnProblem} trackColor={{ true: COLORS.primary }} />
      </View>

      {workingOnProblem && (
        <>
          <Text style={styles.label}>Describe your problem (max 150 words)</Text>
          <TextInput
            style={styles.textarea}
            value={currentProblem}
            onChangeText={setCurrentProblem}
            multiline
            numberOfLines={5}
            placeholder="Briefly describe the problem you're solving..."
            placeholderTextColor="#6B7280"
            textAlignVertical="top"
          />
          <Text style={[styles.wordCount, wordCount > 150 && styles.wordCountOver]}>
            {wordCount} / 150 words
          </Text>
        </>
      )}

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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 8,
  },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, marginTop: 8 },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 120,
  },
  wordCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  wordCountOver: { color: '#DC2626' },
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
