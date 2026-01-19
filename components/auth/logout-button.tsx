'use client'

import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  children?: React.ReactNode
}

export function LogoutButton({ children }: LogoutButtonProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/login')
        }
      }
    })
  }

  return <Button onClick={handleSignOut}>{children ?? 'Sign out'}</Button>
}
