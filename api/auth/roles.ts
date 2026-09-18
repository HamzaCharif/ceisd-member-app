// /api/auth/roles.ts
// Role assignment logic for CEISD Member App.
// Determines whether a newly authenticated user is MEMBER or ADMIN.
// Admin list is driven by environment config — no hardcoded emails.

import { UserRole } from '../../shared/types';

/**
 * Returns the list of admin emails from environment config.
 * Set ADMIN_EMAILS as a comma-separated list in .env, e.g.:
 *   ADMIN_EMAILS=admin1@aus.edu,admin2@aus.edu
 */
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? '';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Determines the role for a user based on their email.
 * Returns ADMIN if email is in the admin list, otherwise MEMBER.
 */
export function assignRole(email: string): UserRole {
  const adminEmails = getAdminEmails();
  if (adminEmails.includes(email.toLowerCase())) {
    return UserRole.ADMIN;
  }
  return UserRole.MEMBER;
}
