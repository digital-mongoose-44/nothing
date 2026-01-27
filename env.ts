import { z } from 'zod'

// Helper to convert empty strings to undefined for zod defaults
const emptyStringToUndefined = <T extends z.ZodTypeAny>(schema: T) => {
  return z.preprocess(val => {
    if (typeof val === 'string' && val === '') return undefined
    return val
  }, schema)
}

// Check if DISABLE_AUTH is enabled (for conditional validation)
const isAuthDisabled = process.env.DISABLE_AUTH === 'true' || process.env.DISABLE_AUTH === '1'
const isProduction = process.env.NODE_ENV === 'production'
const canDisableAuth = !isProduction && isAuthDisabled

// Generate a default secret for development when DISABLE_AUTH is enabled
// This is a 32+ character string that's safe for development use only
const DEFAULT_DEV_SECRET = 'dev-secret-key-min-32-chars-for-better-auth-development-only'

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  // Better Auth - required unless DISABLE_AUTH is enabled in development
  BETTER_AUTH_SECRET: emptyStringToUndefined(
    canDisableAuth ? z.string().min(32).default(DEFAULT_DEV_SECRET) : z.string().min(32)
  ),
  BETTER_AUTH_URL: emptyStringToUndefined(
    canDisableAuth ? z.string().url().default('http://localhost:3000') : z.string().url()
  ),
  // Microsoft Azure AD - required unless DISABLE_AUTH is enabled in development
  MICROSOFT_CLIENT_ID: emptyStringToUndefined(
    canDisableAuth ? z.string().default('dev-client-id') : z.string()
  ),
  MICROSOFT_CLIENT_SECRET: emptyStringToUndefined(
    canDisableAuth ? z.string().default('dev-client-secret') : z.string()
  ),
  MICROSOFT_TENANT_ID: emptyStringToUndefined(z.string().optional()),
  // Development: Disable auth flow (optional, defaults to false)
  DISABLE_AUTH: emptyStringToUndefined(z.string().optional())
})

export type Env = z.infer<typeof envSchema>

export const env = envSchema.parse(process.env)
