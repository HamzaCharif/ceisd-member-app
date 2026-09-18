// /mobile/screens/auth/SignupStep8.tsx
// Section 8 — AI Innovation Profile: 4 open-ended short-answer questions.
// Answers are stored with needsEmbedding: true for Agent 5 to process.

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../shared/constants';
import { SignupFormSection8 } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection8>;
  onNext: (data: SignupFormSection8) => void;
}

const QUESTIONS: Array<{ key: keyof SignupFormSection8; question: string; placeholder: string }> = [
  {
    key: 'frustration',
    question: '1. What problem in the world frustrates you the most?',
    placeholder: 'Describe in 2–3 sentences...',
  },
  {
    key: 'buildIfNoFailure',
    question: '2. What would you build if failure was impossible?',
    placeholder: 'Describe your dream project in 2–3 sentences...',
  },
  {
    key: 'skillsToGain',
    question: '3. What skills do you want to gain this year?',
    placeholder: 'Be specific about what you want to learn...',
  },
  {
    key: 'idealPeople',
    question: '4. What type of people do you work best with?',
    placeholder: 'Describe your ideal collaborator...',
  },
];

export default function SignupStep8({ data, onNext }: Props): React.ReactElement {
  const [answers, setAnswers] = useState<Partial<SignupFormSection8>>(data ?? {});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function setAnswer(key: keyof SignupFormSection8, value: string): void {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleNext(): void {
    const missing = QUESTIONS.filter((q) => !answers[q.key]?.trim());
    if (missing.length > 0) {
      setErrorMsg('Please answer all 4 questions before continuing.');
      return;
    }
    setErrorMsg(null);
    onNext(answers as SignupFormSection8);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>AI Innovation Profile</Text>
      <Text style={styles.subtitle}>Your answers help us find your best matches. Write 2–3 sentences each.</Text>

      {QUESTIONS.map((q) => (
        <View key={q.key} style={styles.questionBlock}>
          <Text style={styles.question}>{q.question}</Text>
          <TextInput
            style={styles.textarea}
            value={answers[q.key] ?? ''}
            onChangeText={(v) => setAnswer(q.key, v)}
            multiline
            numberOfLines={4}
            placeholder={q.placeholder}
            placeholderTextColor="#6B7280"
            textAlignVertical="top"
          />
        </View>
      ))}

      <View style={styles.noticeBox}>
        <Ionicons name="bulb-outline" size={20} color="#1D9E75" style={styles.noticeIcon} />
        <Text style={styles.noticeText}>
          These answers are used by our AI to suggest your best collaborators and personalize your experience.
        </Text>
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
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
  questionBlock: { marginBottom: 20 },
  question: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, lineHeight: 22 },
  textarea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F7F2',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1D9E75',
  },
  noticeIcon: { marginRight: 10, marginTop: 1 },
  noticeText: { flex: 1, fontSize: 13, color: '#6B7280', lineHeight: 18 },
  button: {
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  errorText: { color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' },
});
