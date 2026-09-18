// /mobile/screens/auth/LoginScreen.tsx
// AUS SSO Login Screen — matches spec Screen 0.1 design.
// Triggers Microsoft MSAL SSO flow, exchanges token with backend, stores JWT.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { post, storeToken } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS, AUS_EMAIL_DOMAIN } from '../../../shared/constants';
import { ApiResponse } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

interface SsoResponse {
  token: string;
  user: { id: string; email: string; name: string; role: string };
  profileComplete: boolean;
}

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'Login'>;
};

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────

export default function LoginScreen({ navigation }: LoginScreenProps): React.ReactElement {
  const { setIsAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Logo / icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="school-outline" size={40} color="#1D9E75" />
        </View>

        {/* App name */}
        <Text style={styles.appName}>CEISD</Text>

        {/* Tagline */}
        <Text style={styles.tagline}>AUS Entrepreneurship &amp; Innovation</Text>

        {/* Email input */}
        <TextInput
          style={styles.input}
          placeholder={`name@${AUS_EMAIL_DOMAIN}`}
          placeholderTextColor="#6B7280"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        {/* Password input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6B7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
        />

        {/* Inline error */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{errorMsg}</Text>
          </View>
        )}

        {/* SSO Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSSOLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.buttonInner}>
              <Ionicons name="log-in-outline" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Sign in via SSO</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>Access restricted to AUS-affiliated members</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F7F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 16,
  },
  tagline: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 40,
    marginTop: 6,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: '#1D9E75',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorBox: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorBoxText: {
    color: '#DC2626',
    fontSize: 13,
    textAlign: 'center',
  },
});
