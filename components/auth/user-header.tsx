'use client'

import { useSession } from '@/lib/auth-client'
import { LogoutButton } from './logout-button'

export function UserHeader() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return null
  }

  if (!session) {
    return null
  }

  return (
    <header className="fixed top-0 right-0 z-50 p-4">
      <div className="flex items-center gap-4 bg-black/50 border border-primary/20 rounded-md px-4 py-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">
            {session.user.name || session.user.email}
          </span>
          {session.user.email && session.user.name && (
            <span className="text-xs text-gray-400">{session.user.email}</span>
          )}
        </div>
        <LogoutButton>Sign out</LogoutButton>
      </div>
    </header>
  )
}
