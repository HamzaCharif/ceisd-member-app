// /api/auth/sso.ts
// Microsoft Entra ID (Azure AD) SSO token exchange endpoint.
// Validates @aus.edu domain, creates or fetches User record, returns JWT.

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ConfidentialClientApplication, AuthorizationCodeRequest } from '@azure/msal-node';
import jwt from 'jsonwebtoken';
import { signToken } from './session';
import { assignRole } from './roles';
import { AUS_EMAIL_DOMAIN } from '../../shared/constants';
import { UserRole } from '../../shared/types';


// ─────────────────────────────────────────────
// MSAL Configuration
// ─────────────────────────────────────────────

function getMsalClient(): ConfidentialClientApplication {
  const clientId = process.env.AZURE_CLIENT_ID;
  const tenantId = process.env.AZURE_TENANT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!clientId || !tenantId || !clientSecret) {
    throw new Error('Azure AD credentials are not fully configured in environment variables.');
  }

  return new ConfidentialClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      clientSecret,
    },
  });
}

// ─────────────────────────────────────────────
// ID TOKEN DECODER (without full MSAL exchange)
// ─────────────────────────────────────────────

interface MsalIdTokenClaims {
  email?: string;
  preferred_username?: string;
  name?: string;
  oid?: string;
}

function decodeIdToken(idToken: string): MsalIdTokenClaims {
  // Decode without verification here — MSAL already verified the signature
  const decoded = jwt.decode(idToken) as MsalIdTokenClaims | null;
  if (!decoded) throw new Error('Failed to decode ID token');
  return decoded;
}

// ─────────────────────────────────────────────
// POST /api/auth/sso
// Body: { code: string, redirectUri: string }
// ─────────────────────────────────────────────

/**
 * Exchanges an Azure AD authorization code for tokens.
 * Validates that the email is @aus.edu.
 * Creates or updates the User record.
 * Returns a signed JWT for the mobile app to store.
 */
export async function ssoHandler(req: Request, res: Response): Promise<void> {
  const { code, redirectUri, email: devEmail } = req.body as {
    code?: string;
    redirectUri?: string;
    email?: string;
    password?: string;
  };

  // ── Dev bypass ──────────────────────────────────────────────────────────────
  // When Azure is not configured (local dev), accept email directly.
  if (process.env.NODE_ENV !== 'production' && !process.env.AZURE_CLIENT_ID) {
    if (!devEmail) {
      res.status(400).json({ error: 'email is required in dev mode' });
      return;
    }
    if (!devEmail.endsWith(`@${AUS_EMAIL_DOMAIN}`)) {
      res.status(403).json({ error: `Access restricted to @${AUS_EMAIL_DOMAIN} email addresses only` });
      return;
    }
    try {
      const role = assignRole(devEmail);
      const user = await prisma.user.upsert({
        where: { email: devEmail },
        update: {},
        create: { email: devEmail, name: devEmail.split('@')[0], role },
      });
      await prisma.userStage.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, stage: 'SPARK', totalPoints: 0 },
      });
      const token = signToken({ userId: user.id, email: user.email, role: user.role as unknown as UserRole });
      const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
      res.json({ data: { token, user: { id: user.id, email: user.email, name: user.name, role: user.role }, profileComplete: !!profile } });
    } catch (err) {
      console.error('[sso-dev]', err);
      res.status(500).json({ error: 'Dev login failed' });
    }
    return;
  }
  // ── End dev bypass ──────────────────────────────────────────────────────────

  if (!code || !redirectUri) {
    res.status(400).json({ error: 'code and redirectUri are required' });
    return;
  }

  try {
    const msalClient = getMsalClient();

    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
    } as AuthorizationCodeRequest);

    if (!tokenResponse?.idToken) {
      res.status(401).json({ error: 'Failed to acquire tokens from Azure AD' });
      return;
    }

    const claims = decodeIdToken(tokenResponse.idToken);
    const email = (claims.email ?? claims.preferred_username ?? '').toLowerCase();
    const name = claims.name ?? email.split('@')[0];

    // ── Domain enforcement ──────────────────────────────────────────────────
    if (!email.endsWith(`@${AUS_EMAIL_DOMAIN}`)) {
      res.status(403).json({
        error: `Access restricted to @${AUS_EMAIL_DOMAIN} email addresses only`,
      });
      return;
    }

    // ── Upsert User record ──────────────────────────────────────────────────
    const role = assignRole(email);

    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: {
        email,
        name,
        role: role as unknown as import('@prisma/client').UserRole,
      },
    });

    // ── Sign and return JWT ─────────────────────────────────────────────────
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as unknown as UserRole,
    });

    // Check if the user has completed their profile
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });

    res.json({
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        profileComplete: !!profile,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SSO authentication failed';
    console.error('[sso] Error:', message);
    res.status(500).json({ error: message });
  }
}

// ─────────────────────────────────────────────
// POST /api/auth/complete-profile
// Saves the 9-section signup form data to UserProfile.
// ─────────────────────────────────────────────

import { AuthenticatedRequest } from './session';
import { SignupFormData } from '../../shared/types';

export async function completeProfileHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const formData = req.body as SignupFormData;

  try {
    // Build profile fields from form sections
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        skillRatings: formData.section3.skillRatings as unknown as import('@prisma/client').Prisma.InputJsonValue,
        motivation: {
          whyJoining: formData.section2.whyJoining,
          currentStage: formData.section2.currentStage,
        },
        problemInterests: {
          industries: formData.section4.industries,
          currentProblem: formData.section4.currentProblem,
        },
        founderSignals: {
          pastExperiences: formData.section5.pastExperiences,
          timeCommitment: formData.section5.timeCommitment,
          riskTolerance: formData.section5.riskTolerance,
        },
        collaborationPrefs: {
          lookingFor: formData.section6.lookingFor,
          seeking: formData.section6.seeking,
          teamStyle: formData.section6.teamStyle,
          workStyle: formData.section6.workStyle,
        },
        engagementPrefs: {
          preferredTypes: formData.section7.preferredEngagementTypes,
          communicationChannels: formData.section7.communicationChannels,
        },
        aiProfileAnswers: {
          frustration: formData.section8.frustration,
          buildIfNoFailure: formData.section8.buildIfNoFailure,
          skillsToGain: formData.section8.skillsToGain,
          idealPeople: formData.section8.idealPeople,
        },
        commitmentScore: formData.section9.commitmentScore,
        needsEmbedding: true, // Flag for Agent 5 to generate embeddings
      },
      create: {
        userId,
        skillRatings: formData.section3.skillRatings as unknown as import('@prisma/client').Prisma.InputJsonValue,
        motivation: {
          whyJoining: formData.section2.whyJoining,
          currentStage: formData.section2.currentStage,
        },
        problemInterests: {
          industries: formData.section4.industries,
          currentProblem: formData.section4.currentProblem,
        },
        founderSignals: {
          pastExperiences: formData.section5.pastExperiences,
          timeCommitment: formData.section5.timeCommitment,
          riskTolerance: formData.section5.riskTolerance,
        },
        collaborationPrefs: {
          lookingFor: formData.section6.lookingFor,
          seeking: formData.section6.seeking,
          teamStyle: formData.section6.teamStyle,
          workStyle: formData.section6.workStyle,
        },
        engagementPrefs: {
          preferredTypes: formData.section7.preferredEngagementTypes,
          communicationChannels: formData.section7.communicationChannels,
        },
        aiProfileAnswers: {
          frustration: formData.section8.frustration,
          buildIfNoFailure: formData.section8.buildIfNoFailure,
          skillsToGain: formData.section8.skillsToGain,
          idealPeople: formData.section8.idealPeople,
        },
        commitmentScore: formData.section9.commitmentScore,
        needsEmbedding: true,
      },
    });

    // Update user basic info from section 1
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone: formData.section1.phone,
        college: formData.section1.college,
        yearOfStudy: formData.section1.yearOfStudy as unknown as import('@prisma/client').YearOfStudy,
        graduationYear: formData.section1.graduationYear,
      },
    });

    // Create UserStage record if not exists
    await prisma.userStage.upsert({
      where: { userId },
      update: {},
      create: { userId, stage: 'SPARK', totalPoints: 0 },
    });

    res.json({ data: { profile, message: 'Profile completed successfully' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save profile';
    console.error('[complete-profile] Error:', message);
    res.status(500).json({ error: message });
  }
}

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns the current user's record + profile.
// ─────────────────────────────────────────────

export async function getMeHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, userStage: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}
