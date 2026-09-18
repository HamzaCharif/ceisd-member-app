// /api/content/events.ts
// Events API routes — list, detail, RSVP management, admin creation.

import { Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireAdmin, AuthenticatedRequest } from '../auth/session';

export const eventsRouter = Router();

// GET /api/content/events — list upcoming events, ordered by dateTime
eventsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  try {
    const events = await prisma.event.findMany({
      orderBy: { dateTime: 'asc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        rsvps: { where: { userId }, select: { id: true } },
      },
    });

    const mapped = events.map((e) => ({
      ...e,
      hasRsvp: e.rsvps.length > 0,
      rsvps: undefined,
    }));

    res.json({ data: mapped });
  } catch {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/content/events/:id — event detail
eventsRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        rsvps: { where: { userId }, select: { id: true } },
      },
    });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    res.json({ data: { ...event, hasRsvp: event.rsvps.length > 0, rsvps: undefined } });
  } catch {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/content/events/:id/rsvp — member RSVPs to an event
eventsRouter.post('/:id/rsvp', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id: eventId } = req.params;
  const userId = req.user!.userId;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }
    if (event.rsvpCount >= event.totalSeats) {
      res.status(400).json({ error: 'Event is full' });
      return;
    }

    await prisma.$transaction([
      prisma.eventRsvp.create({ data: { eventId, userId } }),
      prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { increment: 1 } } }),
    ]);

    // Tasks are assigned by admins only (spec §6). RSVPs are surfaced in
    // My Tasks via GET /api/tasks/my-tasks → `upcomingEvents`, not as Task rows.
    const linkedTaskCount = await prisma.task.count({ where: { linkedEventId: eventId } });
    const message = linkedTaskCount > 0
      ? `You're registered for "${event.title}". Attending will complete ${linkedTaskCount} linked task${linkedTaskCount === 1 ? '' : 's'} and earn ${event.pointsForAttendance} points.`
      : `You're registered for "${event.title}". Scan the QR at the door to earn ${event.pointsForAttendance} points.`;

    res.status(201).json({ data: { rsvpd: true, message, seatsRemaining: event.totalSeats - event.rsvpCount - 1 } });
  } catch (error: unknown) {
    // Unique constraint violation — already RSVPed
    if ((error as { code?: string })?.code === 'P2002') {
      res.status(409).json({ error: 'Already RSVPed for this event' });
      return;
    }
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

// DELETE /api/content/events/:id/rsvp — cancel RSVP
eventsRouter.delete('/:id/rsvp', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id: eventId } = req.params;
  const userId = req.user!.userId;

  try {
    await prisma.$transaction([
      prisma.eventRsvp.delete({ where: { eventId_userId: { eventId, userId } } }),
      prisma.event.update({ where: { id: eventId }, data: { rsvpCount: { decrement: 1 } } }),
    ]);
    res.json({ data: { message: 'RSVP cancelled' } });
  } catch {
    res.status(404).json({ error: 'RSVP not found' });
  }
});

// POST /api/content/events — admin only: create event
eventsRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      title, description, bannerImage, dateTime, location, totalSeats,
      speakerName, speakerRole, speakerAvatar, pointsForAttendance,
    } = req.body as {
      title?: string; description?: string; bannerImage?: string;
      dateTime?: string; location?: string; totalSeats?: number;
      speakerName?: string; speakerRole?: string; speakerAvatar?: string;
      pointsForAttendance?: number;
    };

    if (!title || !description || !dateTime || !location || !totalSeats) {
      res.status(400).json({ error: 'title, description, dateTime, location, and totalSeats are required' });
      return;
    }

    try {
      const event = await prisma.event.create({
        data: {
          title,
          description,
          bannerImage,
          dateTime: new Date(dateTime),
          location,
          totalSeats,
          speakerName,
          speakerRole,
          speakerAvatar,
          pointsForAttendance: pointsForAttendance ?? 50,
          createdById: req.user!.userId,
        },
      });
      res.status(201).json({ data: event });
    } catch {
      res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

// PATCH /api/content/events/:id — admin only: edit event
eventsRouter.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const updates = req.body as Record<string, unknown>;
    if (updates.dateTime) updates.dateTime = new Date(updates.dateTime as string);
    try {
      const event = await prisma.event.update({ where: { id }, data: updates });
      res.json({ data: event });
    } catch {
      res.status(404).json({ error: 'Event not found' });
    }
  }
);

// DELETE /api/content/events/:id — admin only
eventsRouter.delete('/:id', requireAuth, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.event.delete({ where: { id } });
    res.json({ data: { message: 'Event deleted' } });
  } catch {
    res.status(404).json({ error: 'Event not found' });
  }
});
