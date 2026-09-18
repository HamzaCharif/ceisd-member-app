// /mobile/components/ConsentCheckbox.tsx
// SPEC §12 COMPLIANCE FIX — "Consent checkbox for AI data processing".
// This requirement was missing from the entire codebase. For an official
// university application processing member behavioral data through AI,
// explicit consent must be captured before profile completion.
//
// INTEGRATION (2 steps):
//
// 1. Add to the final signup step (SignupStep9.tsx), above the submit button:
//      const [aiConsent, setAiConsent] = useState(false);
//      ...
//      <ConsentCheckbox checked={aiConsent} onToggle={() => setAiConsent(v => !v)} />
//      <Button title="Complete Profile" disabled={!aiConsent} onPress={submit} />
//    and include `aiConsent: true` + timestamp in the complete-profile payload.
//
// 2. Persist it — add to prisma/schema.prisma on UserProfile:
//      aiConsentGiven   Boolean  @default(false)
//      aiConsentAt      DateTime?
//    then: npx prisma migrate dev --name add_ai_consent
//    and accept the field in /api/auth/complete-profile.
//
// The API should REJECT profile completion without consent (defense in depth —
// don't rely on the client-side disabled button alone).

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, type, hitSlop } from '../theme/theme';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

export default function ConsentCheckbox({ checked, onToggle }: ConsentCheckboxProps): React.ReactElement {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={hitSlop}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={styles.container}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Ionicons name="checkmark" size={16} color={colors.textOnPrimary} />}
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.text}>
          I consent to CEISD processing my profile, activity, and engagement data using AI to
          provide member matching, event recommendations, and personalized content.
        </Text>
        <Text style={styles.subtext}>
          Your data stays within the CEISD platform, is used only for the features above, and you
          can request an export of your data at any time.
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginVertical: spacing.md,
    gap: spacing.md,
  },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm - 2,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  boxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  textWrap: { flex: 1 },
  text: { ...type.bodySm, color: colors.textPrimary, fontWeight: '500' },
  subtext: { ...type.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
