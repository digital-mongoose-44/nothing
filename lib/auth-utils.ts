/**
 * Role-Based Access Control Utilities
 *
 * Helper functions for checking user roles and enforcing authorization.
 */

import type { UserRole } from '@/lib/auth'
import type { Session } from '@/lib/dal/verifySession'

/**
 * Role hierarchy for permission comparisons
 * Higher number = more privileges
 */
const roleHierarchy: Record<UserRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3
}

/**
 * Check if user has a specific role
 */
export function hasRole(session: Session | null, role: UserRole): boolean {
  return session?.user.role === role
}

/**
 * Check if user has at least the minimum required role
 *
 * @example
 * hasMinRole(session, 'moderator') // true if user is moderator or admin
 */
export function hasMinRole(session: Session | null, minRole: UserRole): boolean {
  if (!session) return false
  return roleHierarchy[session.user.role] >= roleHierarchy[minRole]
}

/**
 * Throw an error if user doesn't have the required minimum role
 *
 * @throws Error if role requirement not met
 */
export function requireRole(session: Session | null, role: UserRole): void {
  if (!hasMinRole(session, role)) {
    throw new Error(`Requires ${role} role`)
  }
}

/**
 * Check if user is an admin
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, 'admin')
}

/**
 * Check if user is at least a moderator (moderator or admin)
 */
export function isModerator(session: Session | null): boolean {
  return hasMinRole(session, 'moderator')
}
