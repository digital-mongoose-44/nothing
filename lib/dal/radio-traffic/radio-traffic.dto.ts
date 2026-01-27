/**
 * Radio Traffic Data Transfer Objects
 *
 * Defines input/output schemas for radio traffic operations using Zod.
 */

import 'server-only'

import { z } from 'zod'

// --- Transcription Types ---

export const TranscriptionSegmentSchema = z.object({
  start: z.number(),
  end: z.number(),
  text: z.string(),
  speaker: z.string().optional(),
  confidence: z.number().optional()
})

export type TranscriptionSegment = z.infer<typeof TranscriptionSegmentSchema>

// --- Output DTOs ---

/**
 * Note: metadata uses z.any() to match Prisma's JsonValue type
 */
export const RadioTrafficSchema = z.object({
  id: z.string().uuid(),
  incidentId: z.string().uuid(),
  audioUrl: z.string().url(),
  duration: z.number().int().positive(),
  transcription: z.array(TranscriptionSegmentSchema),
  metadata: z.any().nullable(),
  uploadedById: z.string().uuid(),
  createdAt: z.date()
})

export type RadioTrafficDTO = z.infer<typeof RadioTrafficSchema>

/**
 * Radio traffic with uploader information
 */
export const RadioTrafficWithUploaderSchema = RadioTrafficSchema.extend({
  uploadedBy: z.object({
    id: z.string(),
    name: z.string().nullable(),
    image: z.string().nullable()
  })
})

export type RadioTrafficWithUploaderDTO = z.infer<
  typeof RadioTrafficWithUploaderSchema
>

// --- Input DTOs ---

export const RadioTrafficCreateInputSchema = z.object({
  incidentId: z.string().uuid(),
  audioUrl: z.string().url(),
  duration: z.number().int().positive(),
  transcription: z.array(TranscriptionSegmentSchema).default([]),
  metadata: z.any().nullable().optional()
})

export type RadioTrafficCreateInput = z.infer<typeof RadioTrafficCreateInputSchema>

export const RadioTrafficUpdateInputSchema = z.object({
  transcription: z.array(TranscriptionSegmentSchema).optional(),
  metadata: z.any().nullable().optional()
})

export type RadioTrafficUpdateInput = z.infer<typeof RadioTrafficUpdateInputSchema>

// --- List Response DTO ---

export const RadioTrafficListResponseSchema = z.object({
  items: z.array(RadioTrafficWithUploaderSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number()
})

export type RadioTrafficListResponse = z.infer<typeof RadioTrafficListResponseSchema>
