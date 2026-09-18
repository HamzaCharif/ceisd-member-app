// /api/matching/match-scorer.ts
// Core match scoring algorithm + "why matched" explanation generation via Claude.

import { prisma } from '../lib/prisma';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface MatchScoreResult {
  score: number;       // 0–100
  reasons: string[];
}

interface SkillRating { skill: string; rating: number }
interface ProfileData {
  skillRatings: SkillRating[];
  problemInterests: { industries?: string[] };
  engagementPrefs: { preferredTypes?: string[] };
  collaborationPrefs: { teamStyle?: string; workStyle?: string };
  aiProfileAnswers: { _themes?: string };
}

function keywordOverlap(a: string[], b: string[]): number {
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const overlap = a.filter((s) => setB.has(s.toLowerCase())).length;
  return overlap / Math.max(a.length, b.length, 1);
}

function skillComplementarity(ratings1: SkillRating[], ratings2: SkillRating[]): number {
  const map2: Record<string, number> = {};
  ratings2.forEach((r) => { map2[r.skill] = r.rating; });

  let complementScore = 0;
  let count = 0;
  ratings1.forEach((r) => {
    const other = map2[r.skill] ?? 3;
    // Complementary: one high (≥4), other low (≤2) → strong complement
    const diff = Math.abs(r.rating - other);
    complementScore += diff / 4;
    count++;
  });

  return count > 0 ? complementScore / count : 0;
}

/**
 * Scores compatibility between two users (0–100).
 */
export async function scoreMatch(userId1: string, userId2: string): Promise<MatchScoreResult> {
  const [user1, user2] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId1 },
      include: {
        profile: true,
        eventAttendances: { select: { eventId: true } },
        noticePosts: { select: { tags: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId2 },
      include: {
        profile: true,
        eventAttendances: { select: { eventId: true } },
        noticePosts: { select: { tags: true } },
      },
    }),
  ]);

  if (!user1?.profile || !user2?.profile) {
    return { score: 0, reasons: ['Incomplete profile data'] };
  }

  const p1 = user1.profile as unknown as ProfileData;
  const p2 = user2.profile as unknown as ProfileData;
  const reasons: string[] = [];
  let totalScore = 0;

  // 1. Shared problem interests — up to 25 points
  const industries1 = p1.problemInterests?.industries ?? [];
  const industries2 = p2.problemInterests?.industries ?? [];
  const interestOverlap = keywordOverlap(industries1, industries2);
  const interestScore = Math.round(interestOverlap * 25);
  if (interestScore > 0) {
    reasons.push(`Share interest in: ${industries1.filter((i) => industries2.includes(i)).join(', ')}`);
  }
  totalScore += interestScore;

  // 2. Complementary skills — up to 25 points
  const skillScore = Math.round(skillComplementarity(p1.skillRatings ?? [], p2.skillRatings ?? []) * 25);
  if (skillScore > 10) {
    reasons.push('Complementary skill sets — covers each other\'s gaps');
  }
  totalScore += skillScore;

  // 3. Engagement preference match — up to 10 points
  const eng1 = p1.engagementPrefs?.preferredTypes ?? [];
  const eng2 = p2.engagementPrefs?.preferredTypes ?? [];
  const engScore = Math.round(keywordOverlap(eng1, eng2) * 10);
  if (engScore > 0) reasons.push('Similar engagement preferences');
  totalScore += engScore;

  // 4. Event attendance overlap — up to 20 points
  const events1 = new Set(user1.eventAttendances.map((e) => e.eventId));
  const events2 = user2.eventAttendances.map((e) => e.eventId);
  const sharedEvents = events2.filter((id) => events1.has(id)).length;
  const eventScore = Math.min(20, sharedEvents * 5);
  if (sharedEvents > 0) {
    reasons.push(`Attended ${sharedEvents} event${sharedEvents > 1 ? 's' : ''} together`);
  }
  totalScore += eventScore;

  // 5. Notice board tag compatibility — up to 10 points
  const tags1 = user1.noticePosts.flatMap((p) => p.tags as string[]);
  const tags2 = user2.noticePosts.flatMap((p) => p.tags as string[]);
  const tagScore = Math.round(keywordOverlap(tags1, tags2) * 10);
  if (tagScore > 0) reasons.push('Similar interests on the Notice Board');
  totalScore += tagScore;

  // 6. Collaboration preference — up to 10 points
  let collabScore = 0;
  if (p1.collaborationPrefs?.teamStyle === p2.collaborationPrefs?.teamStyle) collabScore += 5;
  if (p1.collaborationPrefs?.workStyle === p2.collaborationPrefs?.workStyle) collabScore += 5;
  if (collabScore > 0) reasons.push('Compatible collaboration and work styles');
  totalScore += collabScore;

  // Clamp 0–100
  const finalScore = Math.min(100, Math.max(0, totalScore));

  if (reasons.length === 0) reasons.push('Potential collaboration opportunity');

  return { score: finalScore, reasons };
}

/**
 * Generates a plain-language "why matched" explanation using Claude.
 * Falls back to a formatted string if Claude API fails.
 */
export async function generateExplanation(
  userId1: string,
  userId2: string,
  reasons: string[]
): Promise<string> {
  const [u1, u2] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId1 }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: userId2 }, select: { name: true } }),
  ]);

  const name1 = u1?.name ?? 'Member 1';
  const name2 = u2?.name ?? 'Member 2';

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      messages: [
        {
          role: 'user',
          content: `Given these compatibility signals between ${name1} and ${name2}: ${reasons.join('; ')}. Write a 1–2 sentence plain-English explanation of why they would work well together. Be specific and encouraging. Max 40 words.`,
        },
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : reasons.join('. ');
  } catch {
    // Fallback explanation
    const reason = reasons[0]?.toLowerCase() ?? 'common ground';
    const prefix = reason.startsWith('share') ? 'You' : 'You share';
    return `${prefix} ${reason} — a great foundation for collaboration.`;
  }
}
