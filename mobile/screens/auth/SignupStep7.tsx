// /mobile/screens/auth/SignupStep7.tsx
// Section 7 — Engagement: preferred engagement types + communication channels.

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, ENGAGEMENT_TYPES, COMMUNICATION_CHANNELS } from '../../../shared/constants';
import { SignupFormSection7 } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection7>;
  onNext: (data: SignupFormSection7) => void;
}

export default function SignupStep7({ data, onNext }: Props): React.ReactElement {
  const [preferredEngagementTypes, setEngagementTypes] = useState<string[]>(data?.preferredEngagementTypes ?? []);
  const [communicationChannels, setChannels] = useState<string[]>(data?.communicationChannels ?? []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function toggleEngagement(v: string): void {
    setEngagementTypes((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  function toggleChannel(v: string): void {
    setChannels((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]);
  }

  function handleNext(): void {
    if (preferredEngagementTypes.length === 0 || communicationChannels.length === 0) {
      setErrorMsg('Please select at least one option in each section.');
      return;
    }
    setErrorMsg(null);
    onNext({ preferredEngagementTypes, communicationChannels });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Engagement Preferences</Text>

      <Text style={styles.subtitle}>How do you like to engage? (select all that apply)</Text>
      <View style={styles.chips}>
        {ENGAGEMENT_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, preferredEngagementTypes.includes(opt) && styles.chipActive]}
            onPress={() => toggleEngagement(opt)}
          >
            <Text style={[styles.chipText, preferredEngagementTypes.includes(opt) && styles.chipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.subtitle, { marginTop: 28 }]}>Preferred communication channel(s)</Text>
      <View style={styles.chips}>
        {COMMUNICATION_CHANNELS.map((opt) => (
          <TouchableOpacity
            key={opt}
            style={[styles.chip, communicationChannels.includes(opt) && styles.chipActive]}
            onPress={() => toggleChannel(opt)}
          >
            <Text style={[styles.chipText, communicationChannels.includes(opt) && styles.chipTextActive]}>{opt}</Text>
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
