// /mobile/components/Avatar.tsx
// Circular avatar with graceful initials fallback when no image is available.
//
// Usage:
//   <Avatar name="Aisha Rahman" size={48} />
//   <Avatar uri={user.photoUrl} name={user.name} size={64} ring />

import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { colors, type } from '../theme/theme';

interface AvatarProps {
  name?: string;
  uri?: string | null;
  size?: number;
  ring?: boolean;
  style?: StyleProp<ViewStyle>;
}

function initials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Deterministic soft background from the name, so each person is visually distinct.
const PALETTE = [colors.primary, colors.navy, colors.info, colors.warning, '#7F77DD', '#D85A30'];
function colorFor(name?: string): string {
  if (!name) return colors.navy;
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

export default function Avatar({ name, uri, size = 48, ring = false, style }: AvatarProps): React.ReactElement {
  const [failed, setFailed] = useState(false);
  const showImage = uri && !failed;
  const bg = colorFor(name);

  const dimension: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View
      style={[
        dimension,
        styles.wrap,
        ring ? { borderWidth: 2, borderColor: colors.primary, padding: 2 } : {},
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={[{ width: '100%', height: '100%', borderRadius: size / 2 }]}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={[dimension, styles.fallback, { backgroundColor: bg }]}>
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { ...type.label, color: colors.textOnPrimary, fontWeight: '700' },
});
