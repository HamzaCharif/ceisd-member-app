// /mobile/screens/auth/LoginScreen.tsx
// AUS SSO Login Screen — spec Screen 0.1. Sprint 2 design-system upgrade.
// LOGIC UNCHANGED from the working version: same SSO exchange, same
// validation, same navigation. Only presentation upgraded to theme tokens
// and the shared component library.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { post, storeToken } from '../../../shared/api-client';
import { API_ENDPOINTS, AUS_EMAIL_DOMAIN } from '../../../shared/constants';
import { ApiResponse } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, radius, type, elevation } from '../../theme/theme';
import { Button } from '../../components';

interface SsoResponse {
  token: string;
  user: { id: string; email: string; name: string; role: string };
  profileComplete: boolean;
}

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'Login'>;
};

export default function LoginScreen({ navigation }: LoginScreenProps): React.ReactElement {
  const { setIsAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  async function handleSSOLogin(): Promise<void> {
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg(`Please enter your @${AUS_EMAIL_DOMAIN} email address`);
      return;
    }

    if (!email.toLowerCase().endsWith(`@${AUS_EMAIL_DOMAIN}`)) {
      setErrorMsg(`Access is restricted to @${AUS_EMAIL_DOMAIN} email addresses only`);
      return;
    }

    setLoading(true);
    try {
      const response = await post<ApiResponse<SsoResponse>>(API_ENDPOINTS.AUTH_SSO, {
        code: 'SSO_CODE_FROM_MSAL',
        redirectUri: 'ceisd://auth',
        email: email.toLowerCase(),
        password,
      });

      await storeToken(response.data.token);

      if (!response.data.profileComplete) {
        navigation.navigate('SignupForm', {
          prefillEmail: email.toLowerCase(),
          prefillName: response.data.user.name,
        });
      } else {
        setIsAuthenticated(true);
      }
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Sign-in failed. Check that the API server is running on port 4000.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Soft brand backdrop */}
      <View style={styles.backdrop} />

      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, elevation('lg')]}>
          {/* Logo / icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="school-outline" size={36} color={colors.primary} />
          </View>

          <Text style={styles.heading}>Sign in with AUS{'\n'}Account</Text>
          <Text style={styles.tagline}>Use your @{AUS_EMAIL_DOMAIN} email</Text>

          <TextInput
            style={[styles.input, focusedField === 'email' && styles.inputFocused]}
            placeholder={`name@${AUS_EMAIL_DOMAIN}`}
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={[styles.input, focusedField === 'password' && styles.inputFocused]}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            secureTextEntry
            autoComplete="password"
          />

          {errorMsg && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorBoxText}>{errorMsg}</Text>
            </View>
          )}

          <Button
            title="Sign in via SSO"
            onPress={handleSSOLogin}
            loading={loading}
            leftIcon={<Ionicons name="log-in-outline" size={18} color={colors.textOnPrimary} />}
            style={styles.ssoButton}
          />

          <View style={styles.footerRow}>
            <Ionicons name="lock-closed-outline" size={12} color={colors.textTertiary} />
            <Text style={styles.footer}>Access restricted to AUS-affiliated members</Text>
          </View>
        </View>

        <Text style={styles.brandFooter}>CEISD · AUS Entrepreneurship &amp; Innovation</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: colors.navy,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heading: {
    ...type.h1,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  tagline: {
    ...type.bodySm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    ...type.body,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  errorBoxText: {
    ...type.bodySm,
    color: colors.error,
    flex: 1,
  },
  ssoButton: {
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  footer: {
    ...type.caption,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  brandFooter: {
    ...type.caption,
    color: colors.textTertiary,
    marginTop: spacing.xl,
  },
});
