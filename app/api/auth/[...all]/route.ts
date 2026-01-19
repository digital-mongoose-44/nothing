/**
 * Better Auth API Route Handler
 *
 * Catches all /api/auth/* requests and delegates to Better Auth.
 */

import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
