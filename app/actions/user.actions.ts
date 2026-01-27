'use server'

import { revalidatePath } from 'next/cache'
import { UserDAL } from '@/lib/dal/user/user.dal'
import {
  type UserUpdateInput,
  UserUpdateInputSchema,
  type UserRoleUpdateInput,
  UserRoleUpdateInputSchema
} from '@/lib/dal/user/user.dto'
import { type ActionResult, success, failure } from '@/lib/dal/types'

/**
 * Get current user's profile
 */
export async function getMyProfileAction(): Promise<
  ActionResult<{ user: Awaited<ReturnType<UserDAL['getMyProfile']>> }>
> {
  try {
    const dal = await UserDAL.create()
    const user = await dal.getMyProfile()
    return success({ user })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Get a user's public profile
 */
export async function getUserPublicProfileAction(
  id: string
): Promise<
  ActionResult<{ user: Awaited<ReturnType<UserDAL['getPublicProfile']>> }>
> {
  try {
    const dal = await UserDAL.create()
    const user = await dal.getPublicProfile(id)
    return success({ user })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Get full user details (admin or self only)
 */
export async function getUserDetailsAction(
  id: string
): Promise<
  ActionResult<{ user: Awaited<ReturnType<UserDAL['getUserDetails']>> }>
> {
  try {
    const dal = await UserDAL.create()
    const user = await dal.getUserDetails(id)
    return success({ user })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * List all users (admin/moderator only)
 */
export async function listUsersAction(params?: {
  page?: number
  pageSize?: number
}): Promise<
  ActionResult<Awaited<ReturnType<UserDAL['listUsers']>>>
> {
  try {
    const dal = await UserDAL.create()
    const result = await dal.listUsers(params)
    return success(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Update user profile
 */
export async function updateUserAction(
  id: string,
  input: UserUpdateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = UserUpdateInputSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((e) => e.message).join(', '))
  }

  try {
    const dal = await UserDAL.create()
    const user = await dal.updateUser(id, parsed.data)
    revalidatePath('/users')
    revalidatePath(`/users/${id}`)
    revalidatePath('/profile')
    return success({ id: user.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRoleAction(
  id: string,
  input: UserRoleUpdateInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = UserRoleUpdateInputSchema.safeParse(input)
  if (!parsed.success) {
    return failure(parsed.error.issues.map((e) => e.message).join(', '))
  }

  try {
    const dal = await UserDAL.admin()
    const user = await dal.updateUserRole(id, parsed.data)
    revalidatePath('/users')
    revalidatePath(`/users/${id}`)
    return success({ id: user.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}

/**
 * Delete a user (admin only)
 */
export async function deleteUserAction(
  id: string
): Promise<ActionResult<{ deleted: boolean }>> {
  try {
    const dal = await UserDAL.admin()
    await dal.deleteUser(id)
    revalidatePath('/users')
    return success({ deleted: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return failure(message)
  }
}
