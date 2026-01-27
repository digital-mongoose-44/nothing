/**
 * Incident Data Access Layer
 *
 * Handles all database operations for incidents with authorization checks.
 */

import 'server-only'

import type { UserRole } from '@/lib/auth'
import prisma from '@/lib/db'
import { verifySession } from '../verifySession'
import type { PolicyUser } from '../types'
import {
  canViewIncident,
  canListIncidents,
  canCreateIncident,
  canEditIncident,
  canDeleteIncident,
  canAssignIncident
} from './incident.policy'
import {
  type IncidentDTO,
  type IncidentWithUsersDTO,
  type IncidentCreateInput,
  IncidentCreateInputSchema,
  type IncidentUpdateInput,
  IncidentUpdateInputSchema,
  type IncidentFilter,
  IncidentFilterSchema
} from './incident.dto'

const userSelect = {
  id: true,
  name: true,
  image: true
}

export class IncidentDAL {
  private constructor(
    private readonly userId: string,
    private readonly userRole: UserRole
  ) {}

  private get policyUser(): PolicyUser {
    return { id: this.userId, role: this.userRole }
  }

  /**
   * Factory for authenticated operations (create, update, delete)
   * Requires a valid session
   */
  static async create(): Promise<IncidentDAL> {
    const session = await verifySession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    return new IncidentDAL(session.userId, session.user.role)
  }

  /**
   * Factory for read-only operations
   * Returns null user context if not authenticated
   */
  static async public(): Promise<IncidentDAL> {
    const session = await verifySession().catch(() => null)
    return new IncidentDAL(session?.userId ?? '', session?.user.role ?? 'user')
  }

  /**
   * Factory for admin-only operations
   */
  static async admin(): Promise<IncidentDAL> {
    const session = await verifySession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    if (session.user.role !== 'admin') {
      throw new Error('Requires admin role')
    }
    return new IncidentDAL(session.userId, session.user.role)
  }

  /**
   * List incidents with filtering and pagination
   */
  async listIncidents(params?: {
    filter?: IncidentFilter
    page?: number
    pageSize?: number
  }): Promise<{ incidents: IncidentWithUsersDTO[]; total: number }> {
    if (!canListIncidents(this.policyUser)) {
      throw new Error('Not authorized to list incidents')
    }

    const filter = params?.filter
      ? IncidentFilterSchema.parse(params.filter)
      : {}
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    // Build where clause based on user role
    const baseWhere = {
      ...(filter.status && { status: filter.status }),
      ...(filter.priority && { priority: filter.priority }),
      ...(filter.createdById && { createdById: filter.createdById }),
      ...(filter.assignedToId && { assignedToId: filter.assignedToId })
    }

    // Regular users can only see their own incidents
    const where =
      this.userRole === 'admin' || this.userRole === 'moderator'
        ? baseWhere
        : {
            ...baseWhere,
            OR: [
              { createdById: this.userId },
              { assignedToId: this.userId }
            ]
          }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        include: {
          createdBy: { select: userSelect },
          assignedTo: { select: userSelect }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.incident.count({ where })
    ])

    return { incidents, total }
  }

  /**
   * Get a single incident by ID
   */
  async getIncident(id: string): Promise<IncidentWithUsersDTO | null> {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        createdBy: { select: userSelect },
        assignedTo: { select: userSelect }
      }
    })

    if (!incident) return null

    if (!canViewIncident(this.policyUser, incident)) {
      throw new Error('Not authorized to view this incident')
    }

    return incident
  }

  /**
   * Create a new incident
   */
  async createIncident(input: IncidentCreateInput): Promise<IncidentDTO> {
    const parsed = IncidentCreateInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error('Invalid input')
    }

    if (!canCreateIncident(this.policyUser)) {
      throw new Error('Not authorized to create incidents')
    }

    return prisma.incident.create({
      data: {
        ...parsed.data,
        createdById: this.userId
      }
    })
  }

  /**
   * Update an existing incident
   */
  async updateIncident(
    id: string,
    input: IncidentUpdateInput
  ): Promise<IncidentDTO> {
    const parsed = IncidentUpdateInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error('Invalid input')
    }

    const existing = await prisma.incident.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('Incident not found')
    }

    if (!canEditIncident(this.policyUser, existing)) {
      throw new Error('Not authorized to edit this incident')
    }

    // Check assignment permission
    if (
      parsed.data.assignedToId !== undefined &&
      !canAssignIncident(this.policyUser)
    ) {
      throw new Error('Not authorized to assign incidents')
    }

    return prisma.incident.update({
      where: { id },
      data: parsed.data
    })
  }

  /**
   * Delete an incident (admin only)
   */
  async deleteIncident(id: string): Promise<void> {
    if (!canDeleteIncident(this.policyUser)) {
      throw new Error('Not authorized to delete incidents')
    }

    const existing = await prisma.incident.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('Incident not found')
    }

    await prisma.incident.delete({ where: { id } })
  }

  /**
   * Assign an incident to a user
   */
  async assignIncident(id: string, userId: string | null): Promise<IncidentDTO> {
    if (!canAssignIncident(this.policyUser)) {
      throw new Error('Not authorized to assign incidents')
    }

    const existing = await prisma.incident.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('Incident not found')
    }

    // Verify the target user exists if assigning
    if (userId) {
      const targetUser = await prisma.user.findUnique({ where: { id: userId } })
      if (!targetUser) {
        throw new Error('Target user not found')
      }
    }

    return prisma.incident.update({
      where: { id },
      data: { assignedToId: userId }
    })
  }
}
