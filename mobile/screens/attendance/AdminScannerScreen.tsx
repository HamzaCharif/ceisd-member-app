// /mobile/screens/attendance/AdminScannerScreen.tsx
// Admin QR scanner — scan member QR codes to mark attendance.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { ApiResponse } from '../../../shared/types';

// STUB — replace with real auth context
const IS_ADMIN_STUB = true;

type Props = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'AdminScanner'>;
};

export default function AdminScannerScreen({ navigation }: Props): React.ReactElement {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (!IS_ADMIN_STUB) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.accessDenied}>Access Denied</Text>
          <Text style={styles.accessDeniedSub}>Admin role required to use this screen.</Text>
        </View>
      </SafeAreaView>
    );
  }

  async function handleBarCodeScanned({ data }: BarcodeScanningResult): Promise<void> {
    if (scanned) return;
    setScanned(true);

    try {
      const response = await post<ApiResponse<{ message: string; eventTitle?: string }>>(
        API_ENDPOINTS.ATTENDANCE_LOG,
        { qrToken: data }
      );
      setLastResult(response.data.message);
      Alert.alert('✅ Confirmed', response.data.message);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to confirm attendance';
      setLastResult(`Error: ${msg}`);
      Alert.alert('Error', msg);
    }
  }

  if (hasPermission === null) return <View />;
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Camera permission required.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Admin Scanner</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      </View>

      {lastResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{lastResult}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.resetBtn} onPress={() => { setScanned(false); setLastResult(null); }}>
        <Text style={styles.resetBtnText}>Scan Next Member</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  accessDenied: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  accessDeniedSub: { color: '#aaa', fontSize: 15 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, backgroundColor: '#111',
  },
  backText: { color: COLORS.primary, fontSize: 16, fontWeight: '600' },
  heading: { color: '#fff', fontSize: 18, fontWeight: '700' },
  cameraWrap: { flex: 1 },
  camera: { flex: 1 },
  resultBox: { backgroundColor: '#1A2744', padding: 16, margin: 16, borderRadius: 10 },
  resultText: { color: '#fff', fontSize: 15 },
  resetBtn: {
    margin: 16, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  resetBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  message: { color: '#fff', textAlign: 'center', padding: 32 },
});
