// /api/auth/session.ts
// JWT signing and validation middleware for CEISD Member App.
// Attach this middleware to any API route that requires authentication.

import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import type qs from 'qs';
import { AuthTokenPayload, UserRole } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
  console.warn('[session] WARNING: JWT_SECRET is not set. Set it in .env before deploying.');
}

// ─────────────────────────────────────────────
// TOKEN SIGNING
// ─────────────────────────────────────────────

export interface TokenInput {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Signs a JWT token for a given user payload.
 * Expires in 7 days.
 */
export function signToken(payload: TokenInput): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─────────────────────────────────────────────
// TOKEN VERIFICATION
// ─────────────────────────────────────────────

/**
 * Verifies a JWT token string and returns the payload.
 * Throws if invalid or expired.
 */
export function verifyToken(token: string): AuthTokenPayload {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
}

// ─────────────────────────────────────────────
// EXPRESS MIDDLEWARE — requires authentication
// ─────────────────────────────────────────────

export interface AuthenticatedRequest<
  P = Record<string, string>,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = qs.ParsedQs,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: AuthTokenPayload;
}

/**
 * Express middleware that validates the Bearer JWT token.
 * Attaches the decoded payload to req.user.
 * Returns 401 if token is missing or invalid.
 */
export function requireAuth(
  req: AuthenticatedRequest<Record<string, string>, unknown, unknown>,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Token is invalid or expired' });
  }
}

/**
 * Express middleware that requires the user to be an ADMIN.
 * Must be used after requireAuth.
 */
export function requireAdmin(
  req: AuthenticatedRequest<Record<string, string>, unknown, unknown>,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// ─────────────────────────────────────────────
// SESSION VALIDATION ROUTE HANDLER
// ─────────────────────────────────────────────

/**
 * GET /api/auth/session/validate
 * Returns the current user payload if the token is valid.
 */
export function validateSessionHandler(
  req: AuthenticatedRequest<Record<string, string>, unknown, unknown>,
  res: Response
): void {
  // requireAuth middleware must run before this handler
  res.json({ data: req.user });
}
