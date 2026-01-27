/**
 * User Data Transfer Objects
 *
 * Defines input/output schemas for user operations using Zod.
 */

import 'server-only'

import { z } from 'zod'

// --- Output DTOs ---

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN']),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type UserDTO = z.infer<typeof UserSchema>

/**
 * Public user profile - excludes sensitive fields
 */
export const UserPublicSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  image: z.string().nullable(),
  role: z.enum(['USER', 'MODERATOR', 'ADMIN'])
})

export type UserPublicDTO = z.infer<typeof UserPublicSchema>

// --- Input DTOs ---

export const UserUpdateInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  image: z.string().url().nullable().optional()
})

export type UserUpdateInput = z.infer<typeof UserUpdateInputSchema>

/**
 * Admin-only: Update user role
 */
export const UserRoleUpdateInputSchema = z.object({
  role: z.enum(['USER', 'MODERATOR', 'ADMIN'])
})

export type UserRoleUpdateInput = z.infer<typeof UserRoleUpdateInputSchema>

// --- List Response DTO ---

export const UserListResponseSchema = z.object({
  users: z.array(UserSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
})

export type UserListResponse = z.infer<typeof UserListResponseSchema>
