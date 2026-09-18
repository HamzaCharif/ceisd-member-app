// /api/attendance/qr-generator.ts
// Generates time-limited, HMAC-signed QR tokens for event attendance.
// Tokens are valid for the event window (event.dateTime + 4 hours).

import crypto from 'crypto';
import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const qrGeneratorRouter = Router();

function getQrSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new Error('QR_SECRET environment variable is not set');
  return secret;
}

interface QrPayload {
  eventId: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Generates a signed QR token for an event.
 * Token format: base64url(JSON payload) + '.' + HMAC-SHA256 signature
 * Valid from issuedAt until event.dateTime + 4 hours.
 */
export function generateEventQR(eventId: string, eventDateTime: Date): string {
  const issuedAt = Date.now();
  const expiresAt = new Date(eventDateTime).getTime() + 4 * 60 * 60 * 1000; // +4 hours

  const payload: QrPayload = { eventId, issuedAt, expiresAt };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', getQrSecret())
    .update(payloadB64)
    .digest('hex');

  return `${payloadB64}.${signature}`;
}

/**
 * Parses and returns the payload from a QR token string (without validating signature).
 * Use validateQRToken for full validation.
 */
export function parseQrToken(token: string): QrPayload | null {
  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as QrPayload;
    return payload;
  } catch {
    return null;
  }
}

// GET /api/attendance/qr/:eventId — admin only: get/generate QR token for an event
qrGeneratorRouter.get('/:eventId', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { eventId } = req.params;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const qrToken = generateEventQR(eventId, event.dateTime);

    res.json({
      data: {
        qrToken,
        eventId: event.id,
        eventTitle: event.title,
        eventDateTime: event.dateTime,
        expiresAt: new Date(event.dateTime.getTime() + 4 * 60 * 60 * 1000),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate QR';
    res.status(500).json({ error: message });
  }
});
