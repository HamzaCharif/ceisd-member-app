// /mobile/screens/home/NoticeBoardTab.tsx
// Notice board tab — lists posts, pinned posts first.
// Members see a "+" FAB to create new posts.

import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, FlatList, StyleSheet, TouchableOpacity, Text,
  ActivityIndicator, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { get } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { NoticePost, UserRole, ApiResponse } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../noticeboard/PostCard';

export default function NoticeBoardTab(): React.ReactElement {
  const navigation = useNavigation<{ navigate: (screen: string) => void }>();
  const { userId } = useAuth();
  const userRole = UserRole.MEMBER; // role available in JWT if needed later
  const [posts, setPosts] = useState<NoticePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  async function fetchPosts(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await get<ApiResponse<NoticePost[]>>(API_ENDPOINTS.NOTICEBOARD_POSTS);
      // Pinned posts first
      const sorted = [...response.data].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPosts(sorted);
    } catch {
      setError('Failed to load posts. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <ActivityIndicator style={styles.center} color={COLORS.primary} />;
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchPosts} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>No posts yet. Be the first to post!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUserId={userId ?? ''}
            currentUserRole={userRole}
            onUpdated={fetchPosts}
          />
        )}
      />

      {/* Floating "+" button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewPost')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: COLORS.error, textAlign: 'center', marginBottom: 12 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  list: { padding: 12 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      native: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.2)' },
    }),
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 32 },
});
