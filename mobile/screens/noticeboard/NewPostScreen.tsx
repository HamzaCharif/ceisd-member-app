// /mobile/screens/noticeboard/NewPostScreen.tsx
// New Post screen — matches spec Screen 0.4.
// Members create notice board posts here.

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, SafeAreaView, Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { ApiResponse } from '../../../shared/types';

const POST_TAGS = ['Looking for Partner', 'Seeking Project', 'Offering Skills'];

export default function NewPostScreen(): React.ReactElement {
  const navigation = useNavigation<{ goBack: () => void }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [interest, setInterest] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openToMatches, setOpenToMatches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function toggleTag(tag: string): void {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleSubmit(): Promise<void> {
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter a title and description.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await post<ApiResponse<unknown>>(API_ENDPOINTS.NOTICEBOARD_POSTS, {
        title: title.trim(),
        description: description.trim(),
        projectCategory: interest.trim() || undefined,
        tags: selectedTags,
        skillLabels: [],
        openToMatches,
      });
      navigation.goBack();
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to create post. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>New Post</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Title */}
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What are you looking for?"
          placeholderTextColor={COLORS.textSecondary}
          maxLength={100}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textarea}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          placeholder="Describe your idea, project, or what you need..."
          placeholderTextColor={COLORS.textSecondary}
          textAlignVertical="top"
        />

        {/* Interest / Category */}
        <Text style={styles.label}>Interest / Category (optional)</Text>
        <TextInput
          style={styles.input}
          value={interest}
          onChangeText={setInterest}
          placeholder="e.g. FinTech, EdTech, AI..."
          placeholderTextColor={COLORS.textSecondary}
        />

        {/* Tags */}
        <Text style={styles.label}>Tags</Text>
        <View style={styles.tagRow}>
          {POST_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.tagChipText, selectedTags.includes(tag) && styles.tagChipTextActive]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Open to Matches toggle */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Open to Matches</Text>
          <Switch
            value={openToMatches}
            onValueChange={setOpenToMatches}
            trackColor={{ true: COLORS.primary }}
          />
        </View>

        {/* Error */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: 20, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: COLORS.textPrimary },
  heading: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: COLORS.cardBackground, borderRadius: 12, paddingHorizontal: 16,
    height: 52, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, color: COLORS.textPrimary,
  },
  textarea: {
    backgroundColor: COLORS.cardBackground, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#E5E7EB', fontSize: 15, color: COLORS.textPrimary, minHeight: 130,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tagChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: COLORS.cardBackground,
  },
  tagChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tagChipText: { fontSize: 14, color: COLORS.textPrimary },
  tagChipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  toggleLabel: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 32,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, marginTop: 12 },
  errorText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
});
