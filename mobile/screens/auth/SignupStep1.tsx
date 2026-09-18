// /mobile/screens/auth/SignupStep1.tsx
// Section 1 — Identity: auto-fill email + name from SSO, collect phone, college, year, graduation year.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../../../shared/constants';
import { SignupFormSection1, YearOfStudy } from '../../../shared/types';

interface Props {
  data?: Partial<SignupFormSection1>;
  prefillEmail: string;
  prefillName: string;
  onNext: (data: SignupFormSection1) => void;
}

export default function SignupStep1({ data, prefillEmail, prefillName, onNext }: Props): React.ReactElement {
  const [email] = useState(data?.email ?? prefillEmail);
  const [name, setName] = useState(data?.name ?? prefillName);
  const [phone, setPhone] = useState(data?.phone ?? '');
  const [college, setCollege] = useState(data?.college ?? '');
  const [yearOfStudy, setYearOfStudy] = useState<YearOfStudy>(data?.yearOfStudy ?? YearOfStudy.FRESHMAN);
  const [graduationYear, setGraduationYear] = useState(
    data?.graduationYear?.toString() ?? new Date().getFullYear().toString()
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleNext(): void {
    if (!name.trim() || !phone.trim() || !college.trim() || !graduationYear.trim()) {
      setErrorMsg('Please fill in all fields before continuing.');
      return;
    }
    const year = parseInt(graduationYear, 10);
    if (isNaN(year) || year < 2024 || year > 2035) {
      setErrorMsg('Please enter a valid graduation year (2024–2035).');
      return;
    }
    setErrorMsg(null);
    onNext({ email, name, phone, college, yearOfStudy, graduationYear: year });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Tell us about yourself</Text>

      <Text style={styles.label}>Email (from AUS account)</Text>
      <View style={styles.readonlyInput}>
        <Text style={styles.readonlyText}>{email}</Text>
      </View>

      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#6B7280" />

      <Text style={styles.label}>WhatsApp Phone Number</Text>
      <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+971 50 123 4567" placeholderTextColor="#6B7280" keyboardType="phone-pad" />

      <Text style={styles.label}>College / Major</Text>
      <TextInput style={styles.input} value={college} onChangeText={setCollege} placeholder="e.g. College of Engineering" placeholderTextColor="#6B7280" />

      <Text style={styles.label}>Year of Study</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={yearOfStudy} onValueChange={(v) => setYearOfStudy(v as YearOfStudy)} style={styles.picker}>
          <Picker.Item label="Freshman" value={YearOfStudy.FRESHMAN} />
          <Picker.Item label="Sophomore" value={YearOfStudy.SOPHOMORE} />
          <Picker.Item label="Junior" value={YearOfStudy.JUNIOR} />
          <Picker.Item label="Senior" value={YearOfStudy.SENIOR} />
          <Picker.Item label="Graduate" value={YearOfStudy.GRADUATE} />
        </Picker>
      </View>

      <Text style={styles.label}>Expected Graduation Year</Text>
      <TextInput style={styles.input} value={graduationYear} onChangeText={setGraduationYear} placeholder="e.g. 2026" placeholderTextColor="#6B7280" keyboardType="numeric" maxLength={4} />

      {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, backgroundColor: '#F5F5F5' },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#1A1A1A', marginBottom: 8, marginTop: 12 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
  },
  readonlyInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  readonlyText: { fontSize: 15, color: '#6B7280' },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: { height: 52, color: '#1A1A1A' },
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
