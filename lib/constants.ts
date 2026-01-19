import type { UserRole } from '@/lib/auth'

// CONSTANTS

export const DEV_USER: {
  id: string
  name: string
  email: string
  image: null
  role: UserRole
} = {
  id: 'dev-user-id',
  name: 'Development User',
  email: 'dev@example.com',
  image: null,
  role: 'admin' // Use 'user' for testing non-admin flows
}
