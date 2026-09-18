// /api/admin/members.ts
// Admin member management routes.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const adminMembersRouter = Router();

// GET /api/admin/members — list all members with search + filter
adminMembersRouter.get('/', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { search, role, stage, college, page = '1', limit = '50' } = req.query as {
    search?: string; role?: string; stage?: string; college?: string;
    page?: string; limit?: string;
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  try {
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (college) where.college = { contains: college, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (stage) {
      where.userStage = { stage };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          userStage: true,
          _count: { select: { eventAttendances: true, taskCompletions: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ data: users, total, page: parseInt(page), limit: take });
  } catch {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// GET /api/admin/members/:id — member detail with full profile
adminMembersRouter.get('/:id', requireAuth, requireAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  const { id } = _req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        userStage: true,
        eventAttendances: { include: { event: { select: { id: true, title: true, dateTime: true } } } },
        taskCompletions: { include: { task: { select: { id: true, title: true, type: true } } } },
        matchesAs1: { where: { status: 'CONNECTED' }, include: { user2: { select: { id: true, name: true } } } },
        gamificationRecords: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!user) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    res.json({ data: user });
  } catch {
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

// PATCH /api/admin/members/:id/role — toggle MEMBER ↔ ADMIN
adminMembersRouter.patch('/:id/role', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body as { role?: 'MEMBER' | 'ADMIN' };

  if (!role || !['MEMBER', 'ADMIN'].includes(role)) {
    res.status(400).json({ error: 'role must be MEMBER or ADMIN' });
    return;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { role: role as import('@prisma/client').UserRole },
    });

    await prisma.adminLog.create({
      data: {
        adminId: req.user!.userId,
        action: 'ROLE_CHANGE',
        targetId: id,
        targetType: 'User',
        metadata: { newRole: role },
      },
    });

    res.json({ data: updated });
  } catch {
    res.status(404).json({ error: 'Member not found' });
  }
});
