// /api/admin/export.ts
// CSV and PDF export endpoints for admin dashboard.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const adminExportRouter = Router();

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      // Escape commas and quotes in CSV
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

// GET /api/admin/export/csv — raw member + engagement data
adminExportRouter.get('/csv', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        userStage: true,
        _count: { select: { eventAttendances: true, taskCompletions: true, matchesAs1: true } },
      },
    });

    const rows = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      college: u.college ?? '',
      year: u.yearOfStudy ?? '',
      graduationYear: u.graduationYear ?? '',
      stage: u.userStage?.stage ?? 'SPARK',
      totalPoints: u.userStage?.totalPoints ?? 0,
      eventsAttended: u._count.eventAttendances,
      tasksCompleted: u._count.taskCompletions,
      matches: u._count.matchesAs1,
      joinedAt: u.createdAt.toISOString(),
    }));

    const csv = toCSV(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ceisd-members-${Date.now()}.csv"`);
    res.send(csv);
  } catch {
    res.status(500).json({ error: 'Failed to generate CSV export' });
  }
});

// GET /api/admin/export/pdf — PDF summary of key metrics
adminExportRouter.get('/pdf', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    // Gather summary metrics
    const [totalMembers, totalAttendances, completedTasks, connectedMatches, topMembers] =
      await Promise.all([
        prisma.user.count(),
        prisma.eventAttendance.count(),
        prisma.taskCompletion.count(),
        prisma.match.count({ where: { status: 'CONNECTED' } }),
        prisma.userStage.findMany({
          orderBy: { totalPoints: 'desc' },
          take: 5,
          include: { user: { select: { name: true, email: true } } },
        }),
      ]);

    // Generate a simple HTML-based PDF report
    // In production, use puppeteer or pdfkit for proper PDF rendering.
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CEISD Analytics Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1A1A1A; }
    h1 { color: #1A2744; border-bottom: 2px solid #1D9E75; padding-bottom: 8px; }
    h2 { color: #1D9E75; margin-top: 32px; }
    .metric { display: inline-block; margin: 8px 16px 8px 0; background: #F0FAF5; border-radius: 8px; padding: 12px 20px; }
    .metric-value { font-size: 28px; font-weight: bold; color: #1D9E75; }
    .metric-label { font-size: 12px; color: #6B7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #1A2744; color: white; padding: 8px 12px; text-align: left; }
    td { padding: 8px 12px; border-bottom: 1px solid #E5E7EB; }
    .footer { margin-top: 48px; font-size: 12px; color: #9CA3AF; text-align: center; }
  </style>
</head>
<body>
  <h1>CEISD Member App — Analytics Report</h1>
  <p>Generated: ${new Date().toLocaleDateString('en-AE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

  <h2>Key Metrics</h2>
  <div class="metric"><div class="metric-value">${totalMembers}</div><div class="metric-label">Active Members</div></div>
  <div class="metric"><div class="metric-value">${totalAttendances}</div><div class="metric-label">Total Attendances</div></div>
  <div class="metric"><div class="metric-value">${completedTasks}</div><div class="metric-label">Tasks Completed</div></div>
  <div class="metric"><div class="metric-value">${connectedMatches}</div><div class="metric-label">Successful Matches</div></div>

  <h2>Top 5 Engaged Members</h2>
  <table>
    <tr><th>Rank</th><th>Name</th><th>Email</th><th>Stage</th><th>Points</th></tr>
    ${topMembers.map((m, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${m.user.name}</td>
        <td>${m.user.email}</td>
        <td>${m.stage}</td>
        <td>${m.totalPoints}</td>
      </tr>
    `).join('')}
  </table>

  <div class="footer">CEISD Member App — Confidential Admin Report</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="ceisd-report-${Date.now()}.html"`);
    res.send(html);
  } catch {
    res.status(500).json({ error: 'Failed to generate PDF export' });
  }
});
