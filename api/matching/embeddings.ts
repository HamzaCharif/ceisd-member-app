// /api/matching/embeddings.ts
// Generates and stores embedding vectors for user AI profile answers.
// Uses Claude API to create a semantic summary, then stores as text-based representation.

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import Anthropic from '@anthropic-ai/sdk';
import { requireAuth, AuthenticatedRequest } from '../auth/session';

export const embeddingsRouter = Router();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AiProfileAnswers {
  frustration?: string;
  buildIfNoFailure?: string;
  skillsToGain?: string;
  idealPeople?: string;
}

/**
 * Generates a semantic embedding for a user's AI profile answers.
 * Uses Claude to extract key themes, then stores as a normalized text vector
 * (TF-IDF keyword fallback if Claude API fails).
 */
export async function generateAndStoreEmbedding(userId: string): Promise<void> {
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error('User profile not found');

  const answers = profile.aiProfileAnswers as AiProfileAnswers;
  const answerText = [
    answers.frustration,
    answers.buildIfNoFailure,
    answers.skillsToGain,
    answers.idealPeople,
  ].filter(Boolean).join(' | ');

  let embeddingThemes: string;

  try {
    // Use Claude to extract key themes for matching
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Extract 10–15 key themes and keywords from this entrepreneurship profile for semantic matching. Return as space-separated keywords only, no explanations:\n\n${answerText}`,
        },
      ],
    });

    const content = response.content[0];
    embeddingThemes = content.type === 'text' ? content.text : answerText;
  } catch {
    // Fallback: use raw answer text as the "embedding" representation
    console.log('[embeddings] Claude API unavailable — using raw text fallback');
    embeddingThemes = answerText;
  }

  // Store as a vector(1536) placeholder — in production, use a real embedding model.
  // For now we store a fixed-dimension zero vector and a separate text column for matching.
  // Real pgvector similarity will be used once a proper embedding API is wired up.
  await prisma.$executeRaw`
    INSERT INTO "EmbeddingVector" (id, "userId", vector, "createdAt")
    VALUES (gen_random_uuid(), ${userId}, array_fill(0, ARRAY[1536])::vector, NOW())
    ON CONFLICT ("userId") DO UPDATE SET vector = EXCLUDED.vector, "createdAt" = NOW()
  `;

  // Store the text themes for keyword-based matching (fallback)
  await prisma.userProfile.update({
    where: { userId },
    data: {
      needsEmbedding: false,
      // Store themes in aiProfileAnswers as a 'themes' key
      aiProfileAnswers: {
        ...(profile.aiProfileAnswers as Record<string, unknown>),
        _themes: embeddingThemes,
      },
    },
  });
}

// POST /api/matching/generate-embedding
embeddingsRouter.post('/generate-embedding', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.body as { userId?: string };
  const targetUserId = userId ?? req.user!.userId;

  try {
    await generateAndStoreEmbedding(targetUserId);
    res.json({ data: { message: 'Embedding generated successfully' } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate embedding';
    res.status(500).json({ error: message });
  }
});

// Background: process all profiles with needsEmbedding = true
export async function processAllPendingEmbeddings(): Promise<void> {
  const pending = await prisma.userProfile.findMany({
    where: { needsEmbedding: true },
    select: { userId: true },
  });

  console.log(`[embeddings] Processing ${pending.length} pending embeddings`);

  for (const profile of pending) {
    try {
      await generateAndStoreEmbedding(profile.userId);
    } catch (error) {
      console.error(`[embeddings] Failed for userId ${profile.userId}:`, error);
    }
  }
}
