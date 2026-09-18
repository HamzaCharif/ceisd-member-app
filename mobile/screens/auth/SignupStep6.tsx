// /mobile/screens/auth/SignupStep6.tsx
// Section 6 — Collaboration: looking for, seeking, team style, work style.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, LOOKING_FOR_OPTIONS, SEEKING_OPTIONS, TEAM_STYLE_OPTIONS, WORK_STYLE_OPTIONS } from '../../../shared/constants';
import { SignupFormSection6 } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection6>;
  onNext: (data: SignupFormSection6) => void;
}

export default function SignupStep6({ data, onNext }: Props): React.ReactElement {
  const [lookingFor, setLookingFor] = useState(data?.lookingFor ?? '');
  const [seeking, setSeeking] = useState<string[]>(data?.seeking ?? []);
  const [teamStyle, setTeamStyle] = useState(data?.teamStyle ?? '');
  const [workStyle, setWorkStyle] = useState(data?.workStyle ?? '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function toggleSeeking(s: string): void {
    setSeeking((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function handleNext(): void {
    if (!lookingFor || seeking.length === 0 || !teamStyle || !workStyle) {
      setErrorMsg('Please complete all fields before continuing.');
      return;
    }
    setErrorMsg(null);
    onNext({ lookingFor, seeking, teamStyle, workStyle });
  }

  function renderSingleSelect(
    label: string,
    options: readonly string[],
    value: string,
    setter: (v: string) => void
  ): React.ReactElement {
    return (
      <>
        <Text style={styles.subtitle}>{label}</Text>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.radioRow, value === opt && styles.radioRowActive]}
            onPress={() => setter(opt)}
          >
            <Text style={styles.radioText}>{opt}</Text>
            <View style={[styles.radioCircle, value === opt && styles.radioCircleFilled]} />
          </TouchableOpacity>
        ))}
      </>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Collaboration Preferences</Text>

      {renderSingleSelect("I'm looking to...", LOOKING_FOR_OPTIONS, lookingFor, setLookingFor)}

      <Text style={[styles.subtitle, { marginTop: 24 }]}>What are you looking for?</Text>
      <View style={styles.chips}>
        {SEEKING_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, seeking.includes(opt) && styles.chipActive]}
            onPress={() => toggleSeeking(opt)}
          >
            <Text style={[styles.chipText, seeking.includes(opt) && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 24 }}>
        {renderSingleSelect('Preferred team style', TEAM_STYLE_OPTIONS, teamStyle, setTeamStyle)}
      </View>
      <View style={{ marginTop: 24 }}>
        {renderSingleSelect('Preferred work style', WORK_STYLE_OPTIONS, workStyle, setWorkStyle)}
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
