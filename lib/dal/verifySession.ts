/**
 * Data Access Layer (DAL)
 *
 * Centralizes data requests and authorization logic.
 * All data access should go through this layer to ensure
 * consistent auth checks.
 */

import { env } from '@/env'
import { auth, type UserRole } from '@/lib/auth'
import { DEV_USER } from '@/lib/constants'
import { headers } from 'next/headers'

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
 * Verify the current user session
 *
 * Uses Better Auth to validate the session from request headers.
 * Returns a mock session when DISABLE_AUTH is enabled.
 *
 * @returns Session object with userId and user data, or null if not authenticated
 */
export async function verifySession(): Promise<Session | null> {
  // Check if auth is disabled via environment variable
  // SECURITY: Never allow DISABLE_AUTH in production
  const isProduction = process.env.NODE_ENV === 'production'
  const disableAuth = !isProduction && (env.DISABLE_AUTH === 'true' || env.DISABLE_AUTH === '1')
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
}
