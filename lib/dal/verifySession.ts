/**
 * Data Access Layer (DAL) - Session Verification
 *
 * Centralizes session verification and authorization logic.
 * All data access should go through this layer to ensure
 * consistent auth checks.
 */

import 'server-only'

import { cache } from 'react'
import { headers } from 'next/headers'
import { env } from '@/env'
import { auth, type UserRole } from '@/lib/auth'
import { DEV_USER } from '@/lib/constants'

export interface Session {
  userId: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
    role: UserRole
  }
}

/**
 * Verify and return the current session
 * Cached per request to avoid multiple auth calls
 *
 * Uses Better Auth to validate the session from request headers.
 * Returns a mock session when DISABLE_AUTH is enabled in development.
 *
 * @returns Session object with userId and user data, or null if not authenticated
 */
export const verifySession = cache(async (): Promise<Session | null> => {
  // Check if auth is disabled via environment variable
  // SECURITY: Never allow DISABLE_AUTH in production
  const isProduction = process.env.NODE_ENV === 'production'
  const disableAuth =
    !isProduction && (env.DISABLE_AUTH === 'true' || env.DISABLE_AUTH === '1')
  if (disableAuth) {
    return {
      userId: DEV_USER.id,
      user: {
        id: DEV_USER.id,
        name: DEV_USER.name,
        email: DEV_USER.email,
        image: DEV_USER.image,
        role: DEV_USER.role
      }
    }
  }

  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    return null
  }

  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      role: (session.user.role as UserRole) || 'user'
    }
  }
})

/**
 * Require a valid session, throws if not authenticated
 *
 * @throws Error if not authenticated
 */
export const requireSession = cache(async (): Promise<Session> => {
  const session = await verifySession()
  if (!session) {
    throw new Error('Not authenticated')
  }
  return session
})

/**
 * Get current user or null (for optional auth)
 */
export const getCurrentUser = cache(async () => {
  const session = await verifySession()
  return session?.user ?? null
})
