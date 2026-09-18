// /api/attendance/qr-validator.ts
// Server-side QR token validation — NEVER trust client-side validation.
// Verifies HMAC signature, expiry, and single-use constraint per member.

import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { parseQrToken } from './qr-generator';


function getQrSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new Error('QR_SECRET environment variable is not set');
  return secret;
}

export interface ValidationResult {
  valid: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Validates a QR token for a given user attempting attendance.
 * Checks: signature integrity, expiry, and whether user already attended.
 */
export async function validateQRToken(token: string, userId: string): Promise<ValidationResult> {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Invalid token format' };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Malformed QR token' };
  }

  const [payloadB64, signature] = parts;

  // ── Verify HMAC signature ───────────────────────────────────────────────
  const expectedSig = crypto
    .createHmac('sha256', getQrSecret())
    .update(payloadB64)
    .digest('hex');

  const sigBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return { valid: false, error: 'Invalid QR code signature' };
  }

  // ── Parse payload ───────────────────────────────────────────────────────
  const payload = parseQrToken(token);
  if (!payload) {
    return { valid: false, error: 'Failed to parse QR token' };
  }

  // ── Check expiry ────────────────────────────────────────────────────────
  if (Date.now() > payload.expiresAt) {
    return { valid: false, error: 'QR code has expired' };
  }

  // ── Single-use constraint: check if user already attended ───────────────
  const existingAttendance = await prisma.eventAttendance.findUnique({
    where: {
      eventId_userId: {
        eventId: payload.eventId,
        userId,
      },
    },
  });

  if (existingAttendance) {
    return { valid: false, error: 'Attendance already recorded for this event' };
  }

  return { valid: true, eventId: payload.eventId };
}
