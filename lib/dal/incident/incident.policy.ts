/**
 * Incident Authorization Policies
 *
 * Centralized authorization logic for incident operations.
 */

import 'server-only'

import type { PolicyUser } from '../types'

interface PolicyIncident {
  id: string
  createdById: string
  assignedToId?: string | null
}

/**
 * Check if user can view an incident
 * - Admins and moderators can view all
 * - Users can view incidents they created or are assigned to
 */
export function canViewIncident(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'moderator') return true
  return incident.createdById === user.id || incident.assignedToId === user.id
}

/**
 * Check if user can list incidents
 * - All authenticated users can list (filtered by policy)
 */
export function canListIncidents(user: PolicyUser | null): boolean {
  return Boolean(user)
}

/**
 * Check if user can create incidents
 * - All authenticated users can create incidents
 */
export function canCreateIncident(user: PolicyUser | null): boolean {
  return Boolean(user)
}

/**
 * Check if user can edit an incident
 * - Admins can edit all
 * - Moderators can edit all
 * - Users can only edit incidents they created
 */
export function canEditIncident(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'moderator') return true
  return incident.createdById === user.id
}

/**
 * Check if user can delete an incident
 * - Only admins can delete
 */
export function canDeleteIncident(user: PolicyUser | null): boolean {
  return user?.role === 'admin'
}

/**
 * Check if user can assign incidents
 * - Admins and moderators can assign
 */
export function canAssignIncident(user: PolicyUser | null): boolean {
  if (!user) return false
  return user.role === 'admin' || user.role === 'moderator'
}

/**
 * Check if user can change incident status
 * - Admins and moderators can change any status
 * - Users can change status of incidents they created or are assigned to
 */
export function canChangeIncidentStatus(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'moderator') return true
  return incident.createdById === user.id || incident.assignedToId === user.id
}
