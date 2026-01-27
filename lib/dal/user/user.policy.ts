/**
 * User Authorization Policies
 *
 * Centralized authorization logic for user operations.
 */

import 'server-only'

import type { PolicyUser } from '../types'

interface PolicyTargetUser {
  id: string
}

/**
 * Check if user can view another user's profile
 * - All authenticated users can view public profiles
 */
export function canViewUser(user: PolicyUser | null): boolean {
  return Boolean(user)
}

/**
 * Check if user can view full user details (including email)
 * - Admins can view all
 * - Users can only view their own full details
 */
export function canViewUserDetails(
  user: PolicyUser | null,
  targetUser: PolicyTargetUser
): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.id === targetUser.id
}

/**
 * Check if user can update another user's profile
 * - Admins can update all
 * - Users can only update their own profile
 */
export function canUpdateUser(
  user: PolicyUser | null,
  targetUser: PolicyTargetUser
): boolean {
  if (!user) return false
  if (user.role === 'admin') return true
  return user.id === targetUser.id
}

/**
 * Check if user can update roles
 * - Only admins can update roles
 */
export function canUpdateUserRole(user: PolicyUser | null): boolean {
  return user?.role === 'admin'
}

/**
 * Check if user can list all users
 * - Admins and moderators can list all users
 */
export function canListUsers(user: PolicyUser | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.role === 'moderator'
}

/**
 * Check if user can delete a user
 * - Only admins can delete users
 * - Users cannot delete themselves
 */
export function canDeleteUser(
  user: PolicyUser | null,
  targetUser: PolicyTargetUser
): boolean {
  if (!user) return false
  if (user.role !== 'admin') return false
  return user.id !== targetUser.id // Cannot delete self
}
