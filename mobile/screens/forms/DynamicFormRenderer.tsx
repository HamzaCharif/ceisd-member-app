// /mobile/screens/forms/DynamicFormRenderer.tsx
// Renders a dynamic form from a JSON schema definition.
// Supports: text, textarea, select, multiselect, rating, file (stub), slider.

import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ToastAndroid, Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider';
import { COLORS } from '../../../shared/constants';
import { FormField, FormSchema } from '../../../shared/types';

interface Props {
  schema: FormSchema;
  values: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
}

function showToast(msg: string): void {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
}): React.ReactElement {
  switch (field.type) {
    case 'text':
      return (
        <TextInput
          style={styles.input}
          value={(value as string) ?? ''}
          onChangeText={onChange}
          placeholder={field.placeholder ?? ''}
          placeholderTextColor={COLORS.textSecondary}
        />
      );

    case 'textarea':
      return (
        <TextInput
          style={styles.textarea}
          value={(value as string) ?? ''}
          onChangeText={onChange}
          multiline
          numberOfLines={4}
          placeholder={field.placeholder ?? ''}
          placeholderTextColor={COLORS.textSecondary}
          textAlignVertical="top"
        />
      );

    case 'select':
      return (
        <View style={styles.pickerWrap}>
          <Picker
            selectedValue={(value as string) ?? ''}
            onValueChange={onChange}
            style={styles.picker}
          >
            <Picker.Item label="Select..." value="" />
            {(field.options ?? []).map((opt) => (
              <Picker.Item key={opt} label={opt} value={opt} />
            ))}
          </Picker>
        </View>
      );

    case 'multiselect': {
      const selected = (value as string[]) ?? [];
      return (
        <View style={styles.chips}>
          {(field.options ?? []).map((opt) => {
            const active = selected.includes(opt);
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() =>
                  onChange(
                    active ? selected.filter((s) => s !== opt) : [...selected, opt]
                  )
                }
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    case 'rating': {
      const rating = (value as number) ?? 0;
      const max = field.max ?? 5;
      return (
        <View style={styles.starsRow}>
          {Array.from({ length: max }).map((_, i) => (
            <TouchableOpacity key={i} onPress={() => onChange(i + 1)} style={styles.starBtn}>
              <Text style={[styles.star, rating > i && styles.starFilled]}>
                {rating > i ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    case 'slider': {
      const min = field.min ?? 1;
      const max = field.max ?? 10;
      const current = (value as number) ?? min;
      return (
        <View>
          <Text style={styles.sliderValue}>{current}</Text>
          <Slider
            minimumValue={min}
            maximumValue={max}
            step={1}
            value={current}
            onValueChange={(v) => onChange(Math.round(v))}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor="#E5E7EB"
            thumbTintColor={COLORS.primary}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>{min}</Text>
            <Text style={styles.sliderLabelText}>{max}</Text>
          </View>
        </View>
      );
    }

    case 'file':
      return (
        <TouchableOpacity
          style={styles.fileBtn}
          onPress={() => showToast('File upload coming soon')}
          activeOpacity={0.7}
        >
          <Text style={styles.fileBtnText}>📎  Upload file (coming soon)</Text>
        </TouchableOpacity>
      );

    default:
      return <Text style={styles.unsupported}>Unsupported field type: {field.type}</Text>;
  }
}

export default function DynamicFormRenderer({ schema, values, onChange }: Props): React.ReactElement {
  return (
    <View>
      {schema.fields.map((field) => (
        <View key={field.id} style={styles.fieldBlock}>
          <Text style={styles.label}>
            {field.label}
            {field.required && <Text style={styles.required}> *</Text>}
          </Text>
          <FieldRenderer
            field={field}
            value={values[field.id]}
            onChange={(v) => onChange(field.id, v)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  required: { color: COLORS.error },
  input: {
    backgroundColor: COLORS.cardBackground, borderRadius: 10,
    paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: '#E5E7EB',
    fontSize: 15, color: COLORS.textPrimary,
  },
  textarea: {
    backgroundColor: COLORS.cardBackground, borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#E5E7EB',
    fontSize: 15, color: COLORS.textPrimary, minHeight: 100,
  },
  pickerWrap: { backgroundColor: COLORS.cardBackground, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  picker: { height: 52, color: COLORS.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: COLORS.cardBackground },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.textPrimary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  starsRow: { flexDirection: 'row' },
  starBtn: { paddingHorizontal: 4 },
  star: { fontSize: 28, color: '#D1D5DB' },
  starFilled: { color: COLORS.primary },
  sliderValue: { fontSize: 24, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 4 },
  sliderLabelText: { fontSize: 12, color: COLORS.textSecondary },
  fileBtn: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, alignItems: 'center', borderStyle: 'dashed' },
  fileBtnText: { fontSize: 14, color: COLORS.textSecondary },
  unsupported: { fontSize: 13, color: COLORS.error },
});
