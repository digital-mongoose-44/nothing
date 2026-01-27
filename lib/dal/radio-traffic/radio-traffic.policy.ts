/**
 * Radio Traffic Authorization Policies
 *
 * Centralized authorization logic for radio traffic operations.
 */

import 'server-only'

import type { PolicyUser } from '../types'

interface PolicyRadioTraffic {
  id: string
  uploadedById: string
  incidentId: string
}

interface PolicyIncident {
  id: string
  createdById: string
  assignedToId?: string | null
}

/**
 * Check if user can view radio traffic for an incident
 * - Admins and moderators can view all
 * - Users can view radio traffic for incidents they created or are assigned to
 */
export function canViewRadioTraffic(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'moderator') return true
  return incident.createdById === user.id || incident.assignedToId === user.id
}

/**
 * Check if user can upload radio traffic
 * - All authenticated users can upload to incidents they have access to
 */
export function canCreateRadioTraffic(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'moderator') return true
  return incident.createdById === user.id || incident.assignedToId === user.id
}

/**
 * Check if user can edit radio traffic
 * - Admins can edit all
 * - Moderators can edit all
 * - Users can only edit radio traffic they uploaded
 */
export function canEditRadioTraffic(
  user: PolicyUser | null,
  radioTraffic: PolicyRadioTraffic
): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'moderator') return true
  return radioTraffic.uploadedById === user.id
}

/**
 * Check if user can delete radio traffic
 * - Admins can delete all
 * - Moderators can delete all
 * - Users can only delete radio traffic they uploaded
 */
export function canDeleteRadioTraffic(
  user: PolicyUser | null,
  radioTraffic: PolicyRadioTraffic
): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'moderator') return true
  return radioTraffic.uploadedById === user.id
}

/**
 * Check if user can list radio traffic for an incident
 * - Same permissions as viewing
 */
export function canListRadioTraffic(
  user: PolicyUser | null,
  incident: PolicyIncident
): boolean {
  return canViewRadioTraffic(user, incident)
}
