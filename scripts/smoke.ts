// scripts/smoke.ts
// End-to-end smoke test against a RUNNING api (npm run dev:api) and a real Postgres.
// Seeds admin + 6 members through the public API, then walks every member flow and
// asserts the admin analytics numbers against hand-computed expectations.
//
//   npm run smoke                       # default http://localhost:4000
//   API_URL=http://localhost:4000 npm run smoke
//
// Exit code 0 = every assertion passed. Anything else = a real bug to fix.
// Run this after EVERY backend change. If it goes red, the change broke something.

import 'dotenv/config';
import axios, { AxiosInstance } from 'axios';

const API = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? '4000'}`;

// ─────────────────────────────────────────────
// Tiny assertion harness
// ─────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, ok: boolean, detail?: unknown): void {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    const msg = `  ✗ ${label}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ''}`;
    failures.push(msg);
    console.log(msg);
  }
}
function eq(label: string, actual: unknown, expected: unknown): void {
  check(label, JSON.stringify(actual) === JSON.stringify(expected), { actual, expected });
}
function section(title: string): void {
  console.log(`\n── ${title}`);
}

// ─────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────
interface Session { client: AxiosInstance; userId: string; email: string; name: string; }

async function login(email: string): Promise<Session> {
  const res = await axios.post(`${API}/api/auth/dev-login`, { email });
  const client = axios.create({
    baseURL: API,
    headers: { Authorization: `Bearer ${res.data.token}` },
    validateStatus: () => true, // we assert on status codes ourselves
  });
  return { client, userId: res.data.userId, email, name: email.split('@')[0] };
}

const SKILLS = ['Business / Strategy', 'Technical / Engineering', 'AI / Data', 'Design / UX', 'Marketing / Growth', 'Programming'];

function profileFor(i: number, name: string) {
  const industriesPool = ['HealthTech', 'AI / Software', 'FinTech', 'Sustainability / Climate', 'Education'];
  return {
    section1: { email: `${name}@aus.edu`, name, phone: `+9715000000${i}`, college: i % 2 ? 'CEN' : 'SBA', yearOfStudy: 'JUNIOR', graduationYear: 2027 },
    section2: { whyJoining: ['I want to start a company'], currentStage: i % 2 ? 'I have an idea' : 'I am building a prototype' },
    section3: {
      skillRatings: SKILLS.map((skill, k) => ({ skill, rating: ((i + k) % 5) + 1 })),
      preferredRoles: [i % 2 ? 'Technical Builder' : 'Founder / Leader'],
    },
    section4: { industries: [industriesPool[i % 5], industriesPool[(i + 1) % 5]], workingOnProblem: i % 3 === 0, currentProblem: i % 3 === 0 ? 'Campus food waste' : undefined },
    section5: { pastExperiences: ['Participated in hackathons'], timeCommitment: '5–10 hours', riskTolerance: 'Comfortable experimenting' },
    section6: { lookingFor: 'Yes actively', seeking: [i % 2 ? 'Business cofounder' : 'Technical cofounder'], teamStyle: 'Small focused team (2–3)', workStyle: 'Fast experimenter' },
    section7: { preferredEngagementTypes: ['Workshops', 'Startup building programs'], communicationChannels: ['Platform notifications'] },
    section8: {
      frustration: 'How hard it is to find a cofounder on campus',
      buildIfNoFailure: 'A marketplace for student side-projects',
      skillsToGain: 'Pitching and product design',
      idealPeople: 'People who ship things',
    },
    section9: { commitmentScore: 6 + (i % 4) },
  };
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`CEISD smoke test → ${API}`);

  section('Health');
  const health = await axios.get(`${API}/api/health`, { validateStatus: () => true });
  eq('GET /api/health → 200', health.status, 200);

  section('Auth + profiles');
  const admin = await login('admin@aus.edu');
  const memberNames = ['aisha', 'imran', 'jessica', 'omar', 'lina', 'yousef'];
  const members: Session[] = [];
  for (const n of memberNames) members.push(await login(`${n}@aus.edu`));
  check('admin token is ADMIN', (await admin.client.get('/api/auth/me')).data?.data?.role === 'ADMIN');

  for (let i = 0; i < members.length; i += 1) {
    const r = await members[i].client.post('/api/auth/complete-profile', profileFor(i, members[i].name));
    check(`complete-profile ${members[i].name} → 200`, r.status === 200, r.data);
  }
  const me = await members[0].client.get('/api/auth/me');
  check('GET /api/auth/me returns profile', me.status === 200 && !!me.data?.data);
  const validate = await members[0].client.get('/api/auth/session/validate');
  eq('GET /api/auth/session/validate (mobile path) → 200', validate.status, 200);

  section('Security boundaries');
  const forbidden = await members[0].client.get('/api/admin/analytics/overview');
  eq('member hitting admin analytics → 403', forbidden.status, 403);
  const selfAward = await members[0].client.post('/api/gamification/points', { userId: members[0].userId, reason: 'ATTENDANCE', amount: 5000 });
  eq('member awarding self points → 403', selfAward.status, 403);
  const adminTasks = await admin.client.get('/api/admin/tasks');
  eq('GET /api/admin/tasks (was broken: requireAdmin without requireAuth) → 200', adminTasks.status, 200);

  section('Events, RSVP, QR attendance');
  const now = Date.now();
  const mk = async (title: string, offsetMin: number, seats: number, points = 50) =>
    (await admin.client.post('/api/content/events', {
      title, description: `${title} description`, dateTime: new Date(now + offsetMin * 60_000).toISOString(),
      location: 'CEISD Center, Auditorium 1', totalSeats: seats, pointsForAttendance: points,
      speakerName: 'Sarah Ahmed', speakerRole: 'Lead Innovator',
    })).data.data as { id: string };

  const evLive = await mk('AI for Good Workshop', -30, 40);        // happening now → QR valid
  const evPast = await mk('Pitch Night Series', -60 * 24 * 10, 60, 80); // 10 days ago
  const evFuture = await mk('Annual Innovation Summit', 60 * 24 * 14, 100);
  check('3 events created', !!evLive.id && !!evPast.id && !!evFuture.id);

  // RSVPs: evLive ← members 0..3 (4), evPast ← members 0,1 (2), evFuture ← members 0..5 (6)  ⇒ 12 total
  for (const m of members.slice(0, 4)) await m.client.post(`/api/content/events/${evLive.id}/rsvp`);
  for (const m of members.slice(0, 2)) await m.client.post(`/api/content/events/${evPast.id}/rsvp`);
  for (const m of members) await m.client.post(`/api/content/events/${evFuture.id}/rsvp`);
  const dupRsvp = await members[0].client.post(`/api/content/events/${evLive.id}/rsvp`);
  check('duplicate RSVP rejected (409/400)', dupRsvp.status === 409 || dupRsvp.status === 400, dupRsvp.status);
  const evList = await members[0].client.get('/api/content/events');
  const liveFromList = (evList.data.data as Array<{ id: string; rsvpCount: number }>).find((e) => e.id === evLive.id);
  eq('rsvpCount on live event = 4', liveFromList?.rsvpCount, 4);

  // Task auto-completed by attendance, assigned to ALL
  const taskAuto = (await admin.client.post('/api/tasks', {
    title: 'Attend AI for Good Workshop', description: 'Show up and scan the QR', type: 'WORKSHOP',
    assignedToAll: true, deadline: new Date(now + 7 * 86_400_000).toISOString(),
    completionMethod: 'AUTO_ATTENDANCE', linkedEventId: evLive.id,
  })).data.data as { id: string };
  // Manual-approval task for one person
  const taskManual = (await admin.client.post('/api/tasks', {
    title: 'Submit one-pager', description: 'Upload your idea one-pager', type: 'SUBMISSION',
    assignedToUserId: members[4].userId, deadline: new Date(now + 3 * 86_400_000).toISOString(),
    completionMethod: 'MANUAL_APPROVAL',
  })).data.data as { id: string };
  check('2 tasks created', !!taskAuto.id && !!taskManual.id);

  const qr = await admin.client.get(`/api/attendance/qr/${evLive.id}`);
  eq('admin fetches QR token → 200', qr.status, 200);
  const qrToken = qr.data.data.qrToken as string;

  // members 0,1,2 scan (all RSVP'd). member 4 scans WITHOUT an RSVP.
  for (const m of [members[0], members[1], members[2], members[4]]) {
    const r = await m.client.post('/api/attendance/log', { qrToken });
    check(`${m.name} attendance → 200 with real points`, r.status === 200 && r.data.data.pointsEarned === 50, r.data);
    eq(`${m.name} attendance auto-completed the linked task`, r.data.data.completedTaskIds, [taskAuto.id]);
  }
  const dupScan = await members[0].client.post('/api/attendance/log', { qrToken });
  eq('second scan by same member → 409', dupScan.status, 409);
  const badScan = await members[5].client.post('/api/attendance/log', { qrToken: qrToken.slice(0, -4) + 'zzzz' });
  eq('tampered QR token → 400', badScan.status, 400);

  // Manual override for the past event: member 1 attended
  const manual = await admin.client.post('/api/attendance/manual', { eventId: evPast.id, userId: members[1].userId });
  check('admin manual attendance → 200', manual.status === 200 || manual.status === 201, manual.data);

  section('Points + journey (must match: 50 attendance + 30 task per scan; member1 also +80 past event)');
  const stage0 = await members[0].client.get('/api/gamification/my-stage');
  eq('aisha totalPoints = 80', stage0.data.data.totalPoints, 80);
  const stage1 = await members[1].client.get('/api/gamification/my-stage');
  eq('imran totalPoints = 160 (80 + 80 manual attendance)', stage1.data.data.totalPoints, 160);
  const hist = await members[0].client.get('/api/gamification/my-history');
  eq('aisha has exactly 2 point records (idempotent)', (hist.data.data.records as unknown[]).length, 2);

  section('Tasks');
  const myTasks4 = await members[4].client.get('/api/tasks/my-tasks');
  const t4 = myTasks4.data.data as Array<{ id: string; completion: unknown }>;
  eq('lina sees 2 tasks (global + hers)', t4.length, 2);
  check('lina global task shows completed for HER', !!t4.find((t) => t.id === taskAuto.id)?.completion);
  const myTasks5 = await members[5].client.get('/api/tasks/my-tasks');
  const t5 = myTasks5.data.data as Array<{ id: string; completion: unknown; status: string }>;
  const yousefGlobal = t5.find((t) => t.id === taskAuto.id);
  check('yousef (did not attend) global task NOT completed for him', !!yousefGlobal && yousefGlobal.completion === null);
  eq('global task status stays PENDING (not flipped by other members)', yousefGlobal?.status, 'PENDING');
  const submit = await members[4].client.patch(`/api/tasks/${taskManual.id}/complete`);
  eq('manual completion submit → 200', submit.status, 200);

  section('Notice board');
  const post = await members[2].client.post('/api/content/noticeboard/posts', {
    title: 'Looking for a technical cofounder', description: 'Building a campus food-waste marketplace',
    tags: ['Looking for Partner'], skillLabels: ['Programming'], openToMatches: true,
  });
  eq('create post → 201', post.status, 201);
  await new Promise((r) => setTimeout(r, 150)); // points award is fire-and-forget
  const stage2 = await members[2].client.get('/api/gamification/my-stage');
  eq('jessica totalPoints = 90 (80 + 10 post)', stage2.data.data.totalPoints, 90);

  section('Match Me — invitation flow (the "they receive it" part)');
  const gen = await members[0].client.post('/api/matching/generate-matches');
  check('generate-matches → 200 with matches', gen.status === 200 && gen.data.data.count > 0, gen.data);
  const mine = await members[0].client.get('/api/matching/my-matches');
  const matches = mine.data.data as Array<{ id: string; other: { id: string; name: string }; status: string }>;
  check('my-matches includes `other` shortcut', !!matches[0]?.other?.id);
  const target = matches.find((m) => m.other.id === members[3].userId) ?? matches[0];
  const targetSession = members.find((m) => m.userId === target.other.id)!;

  const beforeCount = (await targetSession.client.get('/api/notifications/unread-count')).data.data.count as number;
  const connect = await members[0].client.patch(`/api/matching/matches/${target.id}`, { action: 'CONNECT' });
  eq('CONNECT → 200 and status REQUESTED (not CONNECTED)', connect.data?.data?.status, 'REQUESTED');
  const dupConnect = await members[0].client.patch(`/api/matching/matches/${target.id}`, { action: 'CONNECT' });
  eq('second CONNECT → 409', dupConnect.status, 409);
  const wrongAccept = await members[0].client.patch(`/api/matching/matches/${target.id}`, { action: 'ACCEPT' });
  eq('requester cannot ACCEPT own invite → 409', wrongAccept.status, 409);

  const afterCount = (await targetSession.client.get('/api/notifications/unread-count')).data.data.count as number;
  eq(`${targetSession.name} unread count went up by 1`, afterCount - beforeCount, 1);
  const inbox = await targetSession.client.get('/api/notifications');
  const invite = (inbox.data.data as Array<{ type: string; title: string; data: { matchId: string } }>).find((n) => n.type === 'MATCH_REQUEST');
  check(`${targetSession.name} received MATCH_REQUEST "${invite?.title}"`, invite?.data?.matchId === target.id, invite);
  const requests = await targetSession.client.get('/api/matching/requests');
  eq(`${targetSession.name} sees 1 pending request`, (requests.data.data as unknown[]).length, 1);
  const targetView = (await targetSession.client.get('/api/matching/my-matches')).data.data as Array<{ id: string; awaitingMyResponse: boolean; iRequested: boolean }>;
  eq('recipient sees awaitingMyResponse=true', targetView.find((m) => m.id === target.id)?.awaitingMyResponse, true);

  const targetPointsBefore = (await targetSession.client.get('/api/gamification/my-stage')).data.data.totalPoints as number;
  const accept = await targetSession.client.patch(`/api/matching/matches/${target.id}`, { action: 'ACCEPT' });
  eq('ACCEPT → CONNECTED', accept.data?.data?.status, 'CONNECTED');
  const targetPointsAfter = (await targetSession.client.get('/api/gamification/my-stage')).data.data.totalPoints as number;
  eq('acceptor got +20', targetPointsAfter - targetPointsBefore, 20);
  const requesterInbox = await members[0].client.get('/api/notifications');
  check('requester received MATCH_ACCEPTED', (requesterInbox.data.data as Array<{ type: string }>).some((n) => n.type === 'MATCH_ACCEPTED'));
  const markRead = await targetSession.client.patch(`/api/notifications/read-all`);
  eq('read-all → 200', markRead.status, 200);
  eq('unread count now 0', (await targetSession.client.get('/api/notifications/unread-count')).data.data.count, 0);

  // A second invite that gets declined, for the success-rate maths
  const second = matches.find((m) => m.other.id !== target.other.id)!;
  const secondSession = members.find((m) => m.userId === second.other.id)!;
  await members[0].client.patch(`/api/matching/matches/${second.id}`, { action: 'CONNECT' });
  const decline = await secondSession.client.patch(`/api/matching/matches/${second.id}`, { action: 'DECLINE' });
  eq('DECLINE → REJECTED', decline.data?.data?.status, 'REJECTED');

  section('Admin analytics — every number checked against what we just did');
  const ov = (await admin.client.get('/api/admin/analytics/overview')).data.data;
  eq('totalMembers = 7 (6 members + admin)', ov.totalMembers, 7);
  eq('activeMembers = 6 (every member RSVP’d in the last 30 days)', ov.activeMembers, 6);
  eq('totalRsvps = 12', ov.totalRsvps, 12);
  eq('totalAttendances = 5 (4 scans + 1 manual)', ov.totalAttendances, 5);
  // attendances that had an RSVP: aisha, imran, jessica on live (3) + imran on past (1) = 4. lina had no RSVP.
  eq('eventAttendanceRate = 4/12 = 33.3%', ov.eventAttendanceRate, 33.3);
  // assignments: global task → 7 users, manual task → 1 ⇒ 8. completions: 4 auto + 1 manual-submitted ⇒ 5
  eq('tasksAssigned = 8', ov.tasksAssigned, 8);
  eq('tasksCompleted = 5', ov.tasksCompleted, 5);
  eq('taskCompletionRate = 5/8 = 62.5% (was hard-wired to 100%)', ov.taskCompletionRate, 62.5);
  eq('pendingApprovals = 1', ov.pendingApprovals, 1);
  eq('connectedMatches = 1', ov.connectedMatches, 1);
  eq('matchSuccessRate = 1 accepted / 2 invitations = 50%', ov.matchSuccessRate, 50);
  eq('upcomingEvents = 1', ov.upcomingEvents, 1);
  eq('totalPosts = 1', ov.totalPosts, 1);

  const byStage = (await admin.client.get('/api/admin/analytics/engagement-by-stage')).data.data as Array<{ stage: string; count: number }>;
  eq('engagement-by-stage returns all 4 stages', byStage.map((s) => s.stage), ['SPARK', 'SHAPE', 'SCALE', 'MENTOR']);
  eq('stage counts sum to 7', byStage.reduce((a, s) => a + s.count, 0), 7);

  const overTime = (await admin.client.get('/api/admin/analytics/events-over-time')).data.data as Array<{ date: string; count: number }>;
  eq('events-over-time has 12 weekly buckets', overTime.length, 12);
  eq('weekly attendance sums to 5', overTime.reduce((a, w) => a + w.count, 0), 5);

  const perEvent = (await admin.client.get('/api/admin/analytics/events')).data.data as Array<{ id: string; rsvps: number; attendances: number; fillRate: number; showUpRate: number }>;
  const live = perEvent.find((e) => e.id === evLive.id)!;
  eq('live event: 4 rsvps / 4 attendances / 10% fill / 100% show-up', [live.rsvps, live.attendances, live.fillRate, live.showUpRate], [4, 4, 10, 100]);

  const top = (await admin.client.get('/api/admin/analytics/top-members')).data.data as Array<{ name: string; totalPoints: number; rank: number }>;
  eq('top member is imran with 160', [top[0]?.name, top[0]?.totalPoints], ['imran', 160]);

  const skills = (await admin.client.get('/api/admin/analytics/skill-distribution')).data.data as Array<{ skill: string; memberCount: number }>;
  eq('skill-distribution covers 6 skills × 6 members', [skills.length, skills[0]?.memberCount], [6, 6]);

  const membersList = await admin.client.get('/api/admin/members');
  eq('GET /api/admin/members → 200', membersList.status, 200);
  const csv = await admin.client.get('/api/admin/export/csv');
  check('CSV export → 200 with content', csv.status === 200 && String(csv.data).length > 50, csv.status);

  // ─────────────────────────────────────────────
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\nFAILURES:');
    for (const f of failures) console.log(f);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\nSmoke test crashed:', err?.response?.data ?? err);
  process.exit(2);
});
