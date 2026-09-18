// /mobile/screens/noticeboard/PostCard.tsx
// Renders a single notice board post card.
// Shows edit/delete for authors; pin/remove/flag for admins; "Message" stub for all.

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ToastAndroid, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { del, patch, post as apiPost } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { NoticePost, UserRole, ApiResponse } from '../../../shared/types';

interface Props {
  post: NoticePost;
  currentUserId: string;
  currentUserRole: UserRole;
  onUpdated: () => void;
}

function showToast(msg: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(msg, ToastAndroid.SHORT);
  }
}

export default function PostCard({ post, currentUserId, currentUserRole, onUpdated }: Props): React.ReactElement {
  const isAuthor = post.authorId === currentUserId;
  const isAdmin = currentUserRole === UserRole.ADMIN;
  const [actionError, setActionError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  async function handleDelete(): Promise<void> {
    const confirmed = Platform.OS === 'web'
      ? (window as Window & { confirm: (msg: string) => boolean }).confirm('Are you sure you want to delete this post?')
      : await new Promise<boolean>((resolve) => {
          Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
            { text: 'Delete', onPress: () => resolve(true), style: 'destructive' },
          ]);
        });

    if (!confirmed) return;
    try {
      await del<ApiResponse<unknown>>(API_ENDPOINTS.NOTICEBOARD_POST(post.id));
      onUpdated();
    } catch {
      setActionError('Failed to delete post.');
    }
  }

  async function handlePin(): Promise<void> {
    try {
      await patch<ApiResponse<unknown>>(API_ENDPOINTS.NOTICEBOARD_PIN(post.id));
      onUpdated();
    } catch {
      setActionError('Failed to pin post.');
    }
  }

  async function handleFlag(): Promise<void> {
    try {
      await patch<ApiResponse<unknown>>(API_ENDPOINTS.NOTICEBOARD_FLAG(post.id));
      onUpdated();
    } catch {
      setActionError('Failed to flag post.');
    }
  }

  async function handleReport(): Promise<void> {
    try {
      await apiPost<ApiResponse<unknown>>(API_ENDPOINTS.NOTICEBOARD_REPORT(post.id), {});
      setReported(true);
    } catch {
      setActionError('Failed to report post.');
    }
  }

  // Initials avatar
  const initials = (post.author?.name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.card, post.isPinned && styles.cardPinned]}>
      {post.isPinned && (
        <View style={styles.pinnedBanner}>
          <Ionicons name="pin-outline" size={14} color="#1D9E75" style={styles.pinnedIcon} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      {/* Author row */}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.authorName}>{post.author?.name ?? 'Member'}</Text>
          <Text style={styles.postDate}>
            {new Date(post.createdAt).toLocaleDateString('en-AE', {
              day: 'numeric', month: 'short',
            })}
          </Text>
        </View>
      </View>

      {/* Title + description */}
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{post.description}</Text>

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagRow}>
          {post.tags.map((tag) => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Skill labels */}
      {post.skillLabels.length > 0 && (
        <View style={styles.tagRow}>
          {post.skillLabels.map((label) => (
            <View key={label} style={styles.skillBadge}>
              <Text style={styles.skillText}>{label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Inline action error */}
      {actionError && (
        <Text style={styles.actionErrorText}>{actionError}</Text>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {/* Message — stub */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => showToast('Chat coming soon')}
        >
          <Text style={styles.actionBtnText}>Message</Text>
        </TouchableOpacity>

        {isAuthor && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete}>
            <Text style={styles.actionBtnDangerText}>Delete</Text>
          </TouchableOpacity>
        )}

        {!isAuthor && !isAdmin && (
          <TouchableOpacity
            style={[styles.actionBtn, reported && styles.actionBtnReported]}
            onPress={handleReport}
            disabled={reported}
          >
            {!reported && (
              <Ionicons name="flag-outline" size={14} color="#1A1A1A" style={styles.btnIcon} />
            )}
            <Text style={[styles.actionBtnText, reported && { color: '#6B7280' }]}>
              {reported ? 'Reported' : 'Report'}
            </Text>
          </TouchableOpacity>
        )}

        {isAdmin && (
          <>
            <TouchableOpacity style={styles.actionBtn} onPress={handlePin}>
              <Text style={styles.actionBtnText}>{post.isPinned ? 'Unpin' : 'Pin'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleFlag}>
              <Text style={styles.actionBtnText}>{post.isFlagged ? 'Unflag' : 'Flag'}</Text>
            </TouchableOpacity>
            {!isAuthor && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnDanger]} onPress={handleDelete}>
                <Text style={styles.actionBtnDangerText}>Remove</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      native: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' },
    }),
  },
  cardPinned: { borderLeftWidth: 3, borderLeftColor: '#1D9E75' },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F7F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  pinnedIcon: { marginRight: 6 },
  pinnedText: { fontSize: 12, color: '#1D9E75', fontWeight: '600' },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { color: '#1D9E75', fontSize: 14, fontWeight: '700' },
  authorName: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  postDate: { fontSize: 12, color: '#6B7280' },
  title: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', marginBottom: 4 },
  description: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tagBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: '#1D9E75', fontSize: 12, fontWeight: '600' },
  skillBadge: {
    backgroundColor: '#F5F5F5',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillText: { color: '#6B7280', fontSize: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnDanger: {
    borderWidth: 0,
    backgroundColor: '#FEF2F2',
  },
  actionBtnReported: { borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  actionBtnText: { fontSize: 13, color: '#1A1A1A' },
  actionBtnDangerText: { fontSize: 13, color: '#DC2626' },
  btnIcon: { marginRight: 4 },
  actionErrorText: { fontSize: 12, color: '#DC2626', marginBottom: 6 },
});
