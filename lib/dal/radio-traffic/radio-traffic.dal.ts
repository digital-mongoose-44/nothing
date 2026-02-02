/**
 * Radio Traffic Data Access Layer
 *
 * Handles all database operations for radio traffic with authorization checks.
 */

import 'server-only'

import type { UserRole } from '@/lib/auth'
import prisma from '@/lib/db'
import type { PolicyUser } from '../types'
import { verifySession } from '../verifySession'
import {
  type RadioTrafficCreateInput,
  RadioTrafficCreateInputSchema,
  type RadioTrafficUpdateInput,
  RadioTrafficUpdateInputSchema
} from './radio-traffic.dto'
import {
  canCreateRadioTraffic,
  canDeleteRadioTraffic,
  canEditRadioTraffic,
  canListRadioTraffic,
  canViewRadioTraffic
} from './radio-traffic.policy'

const uploaderSelect = {
  id: true,
  name: true,
  image: true
} as const

export class RadioTrafficDAL {
  private constructor(
    private readonly userId: string,
    private readonly userRole: UserRole
  ) { }

  private get policyUser(): PolicyUser {
    return { id: this.userId, role: this.userRole }
  }

  /**
   * Factory for authenticated operations
   * Requires a valid session
   */
  static async create(): Promise<RadioTrafficDAL> {
    const session = await verifySession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    return new RadioTrafficDAL(session.userId, session.user.role)
  }

  /**
   * Factory for admin-only operations
   */
  static async admin(): Promise<RadioTrafficDAL> {
    const session = await verifySession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    if (session.user.role !== 'admin') {
      throw new Error('Requires admin role')
    }
    return new RadioTrafficDAL(session.userId, session.user.role)
  }

  /**
   * Get radio traffic by ID
   */
  async getRadioTraffic(id: string) {
    const radioTraffic = await prisma.radioTraffic.findUnique({
      where: { id },
      include: {
        uploadedBy: { select: uploaderSelect },
        incident: {
          select: {
            id: true,
            createdById: true,
            assignedToId: true
          }
        }
      }
    })

    if (!radioTraffic) return null

    if (!canViewRadioTraffic(this.policyUser, radioTraffic.incident)) {
      throw new Error('Not authorized to view this radio traffic')
    }

    const { incident: _, ...result } = radioTraffic
    return result
  }

  /**
   * List radio traffic for an incident
   */
  async listByIncident(
    incidentId: string,
    params?: { page?: number; pageSize?: number }
  ) {
    // First check incident access
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
      select: {
        id: true,
        createdById: true,
        assignedToId: true
      }
    })

    if (!incident) {
      throw new Error('Incident not found')
    }

    if (!canListRadioTraffic(this.policyUser, incident)) {
      throw new Error('Not authorized to list radio traffic for this incident')
    }

    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const [items, total] = await Promise.all([
      prisma.radioTraffic.findMany({
        where: { incidentId },
        include: {
          uploadedBy: { select: uploaderSelect }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.radioTraffic.count({ where: { incidentId } })
    ])

    return { items, total }
  }

  /**
   * Create new radio traffic
   */
  async createRadioTraffic(input: RadioTrafficCreateInput) {
    const parsed = RadioTrafficCreateInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error('Invalid input')
    }

    // Check incident access
    const incident = await prisma.incident.findUnique({
      where: { id: parsed.data.incidentId },
      select: {
        id: true,
        createdById: true,
        assignedToId: true
      }
    })

    if (!incident) {
      throw new Error('Incident not found')
    }

    if (!canCreateRadioTraffic(this.policyUser, incident)) {
      throw new Error('Not authorized to add radio traffic to this incident')
    }

    return prisma.radioTraffic.create({
      data: {
        incidentId: parsed.data.incidentId,
        audioUrl: parsed.data.audioUrl,
        duration: parsed.data.duration,
        transcription: parsed.data.transcription,
        metadata: parsed.data.metadata ?? undefined,
        uploadedById: this.userId
      }
    })
  }

  /**
   * Update radio traffic (transcription/metadata)
   */
  async updateRadioTraffic(id: string, input: RadioTrafficUpdateInput) {
    const parsed = RadioTrafficUpdateInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error('Invalid input')
    }

    const existing = await prisma.radioTraffic.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('Radio traffic not found')
    }

    if (!canEditRadioTraffic(this.policyUser, existing)) {
      throw new Error('Not authorized to edit this radio traffic')
    }

    return prisma.radioTraffic.update({
      where: { id },
      data: {
        ...(parsed.data.transcription !== undefined && {
          transcription: parsed.data.transcription
        }),
        ...(parsed.data.metadata !== undefined && {
          metadata: parsed.data.metadata ?? undefined
        })
      }
    })
  }

  /**
   * Delete radio traffic
   */
  async deleteRadioTraffic(id: string): Promise<void> {
    const existing = await prisma.radioTraffic.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('Radio traffic not found')
    }

    if (!canDeleteRadioTraffic(this.policyUser, existing)) {
      throw new Error('Not authorized to delete this radio traffic')
    }

    await prisma.radioTraffic.delete({ where: { id } })
  }
}
