/**
 * Incident Data Transfer Objects
 *
 * Defines input/output schemas for incident operations using Zod.
 */

import 'server-only'

import { z } from 'zod'

// --- Enums ---

export const IncidentStatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
export type IncidentStatus = z.infer<typeof IncidentStatusEnum>

export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
export type Priority = z.infer<typeof PriorityEnum>

// --- Output DTOs ---

export const IncidentSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  status: IncidentStatusEnum,
  priority: PriorityEnum,
  createdById: z.string(),
  assignedToId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type IncidentDTO = z.infer<typeof IncidentSchema>

/**
 * Incident with related user information
 */
export const IncidentWithUsersSchema = IncidentSchema.extend({
  createdBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable()
  }),
  assignedTo: z
    .object({
      id: z.string(),
      name: z.string().nullable(),
      image: z.string().nullable()
    })
    .nullable()
})

export type IncidentWithUsersDTO = z.infer<typeof IncidentWithUsersSchema>

// --- Input DTOs ---

export const IncidentCreateInputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  priority: PriorityEnum.default('MEDIUM')
})

export type IncidentCreateInput = z.infer<typeof IncidentCreateInputSchema>

export const IncidentUpdateInputSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: IncidentStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assignedToId: z.string().uuid().nullable().optional()
})

export type IncidentUpdateInput = z.infer<typeof IncidentUpdateInputSchema>

// --- Filter/Query DTOs ---

export const IncidentFilterSchema = z.object({
  status: IncidentStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  createdById: z.string().uuid().optional(),
  assignedToId: z.string().uuid().optional()
})

export type IncidentFilter = z.infer<typeof IncidentFilterSchema>

// --- List Response DTO ---

export const IncidentListResponseSchema = z.object({
  incidents: z.array(IncidentWithUsersSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
})

export type IncidentListResponse = z.infer<typeof IncidentListResponseSchema>
