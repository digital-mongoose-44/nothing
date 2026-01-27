/**
 * Shared types for the Data Access Layer
 */

import 'server-only'

import type { UserRole } from '@/lib/auth'

/**
 * User context for policy checks
 */
export interface PolicyUser {
  id: string
  role: UserRole
}

/**
 * Discriminated union for action results
 * Provides type-safe error handling in server actions
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string }

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Create a successful action result
 */
export function success<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

/**
 * Create a failed action result
 */
export function failure<T>(error: string): ActionResult<T> {
  return { ok: false, error }
}
