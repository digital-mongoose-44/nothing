/**
 * Better Auth Server Configuration
 *
 * Stateless JWT-based authentication with Azure AD (Microsoft Entra ID).
 * No database required - sessions stored in signed cookies.
 *
 * Roles are extracted from Azure AD App Roles claim and stored in the session.
 */

import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { customSession } from 'better-auth/plugins'

/**
 * Valid user roles - managed in Azure Entra ID App Roles
 * Hierarchy: admin > moderator > user
 */
export type UserRole = 'admin' | 'moderator' | 'user'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      // Use 'common' for multi-tenant, or your specific tenant ID
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      prompt: 'select_account',
      scope: ['openid', 'profile', 'email', 'User.Read'],
      // Map Azure profile to user, extracting roles from the ID token
      mapProfileToUser: (profile) => {
        // Azure AD includes roles in the profile from the ID token
        // when App Roles are configured and roles claim is enabled
        const roles = (profile.roles as string[]) || []

        // Determine highest priority role (admin > moderator > user)
        let role: UserRole = 'user'
        if (roles.includes('admin')) {
          role = 'admin'
        } else if (roles.includes('moderator')) {
          role = 'moderator'
        }

        return {
          role // This adds the role to the user object
        }
      }
    }
  },
  // Add role to user schema for stateless sessions
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'user'
      }
    }
  },
  // Stateless mode - no database, sessions in JWE cookies
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      strategy: 'jwe', // Encrypted JWT
      refreshCache: true
    }
  },
  account: {
    storeStateStrategy: 'cookie',
    storeAccountCookie: true
  },
  plugins: [
    nextCookies(), // Handle cookies in server actions
    // Add role to session response
    customSession(async ({ user, session }) => {
      // Cast user to include role from additionalFields
      const userWithRole = user as typeof user & { role?: string }
      return {
        user: {
          ...user,
          role: (userWithRole.role as UserRole) || 'user'
        },
        session
      }
    })
  ]
})

export type Session = typeof auth.$Infer.Session
