// /mobile/screens/auth/SignupStep3.tsx
// Section 3 — Skills: rating grid (1–5) for 11 skills + preferred team role (multi-select).

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SKILLS_LIST, TEAM_ROLES } from '../../../shared/constants';
import { SignupFormSection3, SkillRating } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection3>;
  onNext: (data: SignupFormSection3) => void;
}

function buildInitialRatings(existing?: SkillRating[]): Record<string, number> {
  const map: Record<string, number> = {};
  SKILLS_LIST.forEach((s) => { map[s] = 3; });
  existing?.forEach((r) => { map[r.skill] = r.rating; });
  return map;
}

export default function SignupStep3({ data, onNext }: Props): React.ReactElement {
  const [ratings, setRatings] = useState<Record<string, number>>(buildInitialRatings(data?.skillRatings));
  const [preferredRoles, setPreferredRoles] = useState<string[]>(data?.preferredRoles ?? []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function setRating(skill: string, value: number): void {
    setRatings((prev) => ({ ...prev, [skill]: value }));
  }

  function toggleRole(role: string): void {
    setPreferredRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  }

  function handleNext(): void {
    if (preferredRoles.length === 0) {
      setErrorMsg('Please select at least one preferred team role.');
      return;
    }
    setErrorMsg(null);
    const skillRatings: SkillRating[] = Object.entries(ratings).map(([skill, rating]) => ({ skill, rating }));
    onNext({ skillRatings, preferredRoles });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Rate your skills (1–5)</Text>
      {SKILLS_LIST.map((skill) => (
        <View key={skill} style={styles.skillRow}>
          <Text style={styles.skillName}>{skill}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(skill, n)} style={styles.starBtn}>
                <Text style={[styles.star, ratings[skill] >= n && styles.starFilled]}>{ratings[skill] >= n ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.title, { marginTop: 32 }]}>Preferred team role(s)</Text>
      <View style={styles.chips}>
        {TEAM_ROLES.map((role) => (
          <TouchableOpacity
            key={role}
            style={[styles.chip, preferredRoles.includes(role) && styles.chipActive]}
            onPress={() => toggleRole(role)}
          >
            <Text style={[styles.chipText, preferredRoles.includes(role) && styles.chipTextActive]}>{role}</Text>
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
  skillRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  skillName: { flex: 1, fontSize: 14, color: '#1A1A1A' },
  stars: { flexDirection: 'row' },
  starBtn: { paddingHorizontal: 4 },
  star: { fontSize: 22, color: '#D1D5DB' },
  starFilled: { color: '#1D9E75' },
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
