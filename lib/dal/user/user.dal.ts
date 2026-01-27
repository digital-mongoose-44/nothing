/**
 * User Data Access Layer
 *
 * Handles all database operations for users with authorization checks.
 */

import 'server-only'

import type { UserRole } from '@/lib/auth'
import prisma from '@/lib/db'
import { verifySession } from '../verifySession'
import type { PolicyUser } from '../types'
import {
  canViewUser,
  canViewUserDetails,
  canUpdateUser,
  canUpdateUserRole,
  canListUsers,
  canDeleteUser
} from './user.policy'
import {
  type UserDTO,
  type UserPublicDTO,
  type UserUpdateInput,
  UserUpdateInputSchema,
  type UserRoleUpdateInput,
  UserRoleUpdateInputSchema
} from './user.dto'

export class UserDAL {
  private constructor(
    private readonly userId: string,
    private readonly userRole: UserRole
  ) {}

  private get policyUser(): PolicyUser {
    return { id: this.userId, role: this.userRole }
  }

  /**
   * Factory for authenticated operations
   * Requires a valid session
   */
  static async create(): Promise<UserDAL> {
    const session = await verifySession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    return new UserDAL(session.userId, session.user.role)
  }

  /**
   * Factory for admin-only operations
   */
  static async admin(): Promise<UserDAL> {
    const session = await verifySession()
    if (!session) {
      throw new Error('Not authenticated')
    }
    if (session.user.role !== 'admin') {
      throw new Error('Requires admin role')
    }
    return new UserDAL(session.userId, session.user.role)
  }

  /**
   * Get current user's own profile
   */
  async getMyProfile(): Promise<UserDTO | null> {
    const user = await prisma.user.findUnique({
      where: { id: this.userId }
    })
    return user
  }

  /**
   * Get a user's public profile
   */
  async getPublicProfile(id: string): Promise<UserPublicDTO | null> {
    if (!canViewUser(this.policyUser)) {
      throw new Error('Not authorized to view users')
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        role: true
      }
    })

    return user
  }

  /**
   * Get full user details (admin or self only)
   */
  async getUserDetails(id: string): Promise<UserDTO | null> {
    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return null

    if (!canViewUserDetails(this.policyUser, targetUser)) {
      throw new Error('Not authorized to view user details')
    }

    return targetUser
  }

  /**
   * List all users (admin/moderator only)
   */
  async listUsers(params?: {
    page?: number
    pageSize?: number
  }): Promise<{ users: UserDTO[]; total: number }> {
    if (!canListUsers(this.policyUser)) {
      throw new Error('Not authorized to list users')
    }

    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const skip = (page - 1) * pageSize

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize
      }),
      prisma.user.count()
    ])

    return { users, total }
  }

  /**
   * Update own profile or admin update any user
   */
  async updateUser(id: string, input: UserUpdateInput): Promise<UserDTO> {
    const parsed = UserUpdateInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error('Invalid input')
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('User not found')
    }

    if (!canUpdateUser(this.policyUser, existing)) {
      throw new Error('Not authorized to update this user')
    }

    return prisma.user.update({
      where: { id },
      data: parsed.data
    })
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(id: string, input: UserRoleUpdateInput): Promise<UserDTO> {
    const parsed = UserRoleUpdateInputSchema.safeParse(input)
    if (!parsed.success) {
      throw new Error('Invalid input')
    }

    if (!canUpdateUserRole(this.policyUser)) {
      throw new Error('Not authorized to update user roles')
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('User not found')
    }

    return prisma.user.update({
      where: { id },
      data: { role: parsed.data.role }
    })
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(id: string): Promise<void> {
    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) {
      throw new Error('User not found')
    }

    if (!canDeleteUser(this.policyUser, existing)) {
      throw new Error('Not authorized to delete this user')
    }

    await prisma.user.delete({ where: { id } })
  }
}
