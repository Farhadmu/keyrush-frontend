import { getCurrentUser, UserSession } from './api';

export type AppRole = 'USER' | 'ORGANIZER' | 'SUPER_ADMIN';

export function normalizeRole(role?: string): AppRole {
  if (!role) return 'USER';
  const r = role.toUpperCase();
  if (['SUPER_ADMIN', 'PLATFORM_MODERATOR', 'ADMIN'].includes(r)) return 'SUPER_ADMIN';
  if (['ORGANIZER', 'ORGANIZATION_ADMIN', 'COMPETITION_ADMIN'].includes(r)) return 'ORGANIZER';
  return 'USER';
}

export function getUserRole(user?: UserSession | null): AppRole {
  if (!user) return 'USER';
  const roles = user.roles || [];
  if (roles.some((r) => ['SUPER_ADMIN', 'PLATFORM_MODERATOR', 'ADMIN'].includes(r.toUpperCase()))) {
    return 'SUPER_ADMIN';
  }
  if (roles.some((r) => ['ORGANIZER', 'ORGANIZATION_ADMIN', 'COMPETITION_ADMIN'].includes(r.toUpperCase()))) {
    return 'ORGANIZER';
  }
  return 'USER';
}

/**
 * Checks whether the current user is permitted to access racer/player gameplay
 * (e.g. Practice, Multiplayer, 3D Garage, Battle Pass, Player Dashboard).
 * Organizers and Super Admins are strictly non-player administrative roles.
 */
export function checkGamingAccess(): {
  allowed: boolean;
  redirectUrl?: string;
  role: AppRole;
  reason?: string;
} {
  const user = getCurrentUser();
  if (!user) return { allowed: true, role: 'USER' };

  const role = getUserRole(user);
  if (role === 'ORGANIZER') {
    return {
      allowed: false,
      redirectUrl: '/organizer',
      role: 'ORGANIZER',
      reason: 'Organizers manage esports competitions and cannot participate in racer gameplay. Redirected to Organizer Portal.',
    };
  }
  if (role === 'SUPER_ADMIN') {
    return {
      allowed: false,
      redirectUrl: '/admin',
      role: 'SUPER_ADMIN',
      reason: 'Platform Admins have global authority and cannot enter racer gameplay. Redirected to Admin Console.',
    };
  }

  return { allowed: true, role: 'USER' };
}

