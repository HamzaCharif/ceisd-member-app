// /mobile/screens/attendance/SignAttendanceScreen.tsx
// Member QR scanner — scan event QR code to log attendance.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform,
} from 'react-native';
import { CameraView, Camera, BarcodeScanningResult } from 'expo-camera';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { post } from '../../../shared/api-client';
import { API_ENDPOINTS, COLORS } from '../../../shared/constants';
import { ApiResponse } from '../../../shared/types';

type Props = {
  navigation: NativeStackNavigationProp<Record<string, object | undefined>, 'SignAttendance'>;
};

interface AttendanceResponse {
  message: string;
  eventTitle?: string;
  pointsEarned?: number;
}

export default function SignAttendanceScreen({ navigation }: Props): React.ReactElement {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Camera is not available in a web browser
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.heading}>Sign Attendance</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.webFallback}>
          <Text style={styles.webFallbackIcon}>📱</Text>
          <Text style={styles.webFallbackTitle}>Use the Mobile App</Text>
          <Text style={styles.webFallbackText}>
            QR code scanning requires the native mobile app. Open the app on your phone to sign attendance.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  async function handleBarCodeScanned({ data }: BarcodeScanningResult): Promise<void> {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      const response = await post<ApiResponse<AttendanceResponse>>(
        API_ENDPOINTS.ATTENDANCE_LOG,
        { qrToken: data }
      );

      navigation.navigate('AttendanceSuccess', {
        eventTitle: response.data.eventTitle ?? 'Event',
        pointsEarned: response.data.pointsEarned ?? 50,
      });
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Failed to record attendance';
      setErrorMsg(msg);
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  }

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.message}>Camera access denied.</Text>
        <Text style={styles.subMessage}>Please enable camera access in Settings.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>Sign Attendance</Text>
        <View style={{ width: 36 }} />
      </View>

      <Text style={styles.instruction}>Point your camera at the event QR code</Text>

      {/* Camera scanner */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          {/* Scanner overlay */}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            {processing && <Text style={styles.processingText}>Processing...</Text>}
          </View>
        </CameraView>
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorBoxText}>{errorMsg}</Text>
        </View>
      )}

      {scanned && !processing && (
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => { setScanned(false); setErrorMsg(null); }}
        >
          <Text style={styles.resetBtnText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: 20 },
  heading: { color: '#fff', fontSize: 18, fontWeight: '700' },
  instruction: { color: '#aaa', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  cameraContainer: { flex: 1, overflow: 'hidden', marginHorizontal: 0 },
  camera: { flex: 1 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: {
    width: 240, height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: COLORS.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  processingText: { color: '#fff', fontSize: 16, marginTop: 24, fontWeight: '600' },
  resetBtn: {
    margin: 24, backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  resetBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  message: { color: '#fff', fontSize: 16, textAlign: 'center', padding: 32 },
  subMessage: { color: '#aaa', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  errorBox: { margin: 16, backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12 },
  errorBoxText: { color: '#DC2626', fontSize: 14, textAlign: 'center' },
  webFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  webFallbackIcon: { fontSize: 56, marginBottom: 16 },
  webFallbackTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  webFallbackText: { fontSize: 15, color: '#aaa', textAlign: 'center', lineHeight: 22 },
});
