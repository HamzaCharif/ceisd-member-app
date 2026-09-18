// /api/server.ts
// Express server entry point — mounts all routers.

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';
import { ssoHandler, completeProfileHandler, getMeHandler } from './auth/sso';
import { validateSessionHandler, requireAuth, signToken } from './auth/session';
import { assignRole } from './auth/roles';

import { adminMembersRouter } from './admin/members';
import { adminAnalyticsRouter } from './admin/analytics';
import { adminExportRouter } from './admin/export';
import { adminAiInsightsRouter } from './admin/ai-insights';
import { adminTasksRouter } from './admin/adminTasks';
import { announcementsRouter } from './content/announcements';
import { eventsRouter } from './content/events';
import { noticeboardRouter } from './content/noticeboard';
import { tasksRouter } from './tasks/tasks';
import { taskCompletionRouter } from './tasks/task-completion';
import { formsRouter } from './tasks/forms';
import { attendanceLoggerRouter } from './attendance/attendance-logger';
import { qrGeneratorRouter } from './attendance/qr-generator';
import { pointsEngineRouter } from './gamification/points-engine';
import { leaderboardRouter } from './gamification/leaderboard';
import { journeyStagesRouter } from './gamification/journey-stages';
import { matchMeRouter } from './matching/match-me';
import { mentorRouter } from './matching/mentor-recommender';
import { eventRankerRouter } from './matching/event-ranker';
import { dataLoggerRouter } from './matching/data-logger';
import { embeddingsRouter } from './matching/embeddings';
import { notificationsRouter } from './notifications/notifications';

const app = express();

if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN) {
  throw new Error('CORS_ORIGIN must be set in production');
}

app.use(cors({
  origin: process.env.NODE_ENV !== 'production' ? true : process.env.CORS_ORIGIN,
  credentials: true,
}));
app.use(express.json());

// Auth
app.post('/api/auth/sso', ssoHandler);
app.post('/api/auth/complete-profile', requireAuth, completeProfileHandler);
app.get('/api/auth/me', requireAuth, getMeHandler);
app.get('/api/auth/validate-session', requireAuth, validateSessionHandler);
app.get('/api/auth/session/validate', requireAuth, validateSessionHandler); // path the mobile client uses

// Dev-only login bypass — works without Azure, only active in development
if (process.env.NODE_ENV !== 'production') {
  app.post('/api/auth/dev-login', async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: 'email is required' }); return; }

    const role = assignRole(email);

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: { role },
        create: { email, name: email.split('@')[0], role },
      });

      // Ensure UserStage exists
      await prisma.userStage.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, stage: 'SPARK', totalPoints: 0 },
      });

      const token = signToken({ userId: user.id, email: user.email, role: user.role as import('../shared/types').UserRole });
      res.json({ token, role: user.role, userId: user.id });
    } catch (err) {
      console.error('[dev-login]', err);
      res.status(500).json({ error: 'Dev login failed' });
    }
  });
  console.log('[dev] /api/auth/dev-login enabled (development only)');
}

// Content
app.use('/api/content/announcements', announcementsRouter);
app.use('/api/content/events', eventsRouter);
app.use('/api/content/noticeboard', noticeboardRouter);

// Tasks & Forms
app.use('/api/tasks', tasksRouter);
app.use('/api/tasks', taskCompletionRouter);
app.use('/api/tasks/forms', formsRouter);

// Attendance
app.use('/api/attendance', attendanceLoggerRouter);
app.use('/api/attendance/qr', qrGeneratorRouter);

// Gamification
app.use('/api/gamification', pointsEngineRouter);
app.use('/api/gamification', leaderboardRouter);
app.use('/api/gamification', journeyStagesRouter);

// Matching / AI
app.use('/api/matching', matchMeRouter);
app.use('/api/matching', mentorRouter);
app.use('/api/matching', eventRankerRouter);
app.use('/api/matching', dataLoggerRouter);
app.use('/api/matching', embeddingsRouter);

// Notifications
app.use('/api/notifications', notificationsRouter);

// Admin
app.use('/api/admin/members', adminMembersRouter);
app.use('/api/admin/analytics', adminAnalyticsRouter);
app.use('/api/admin/export', adminExportRouter);
app.use('/api/admin/ai-insights', adminAiInsightsRouter);
app.use('/api/admin/tasks', adminTasksRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = parseInt(process.env.PORT ?? '4000');
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`CEISD API running on port ${PORT}`);
  });
}

export default app;
