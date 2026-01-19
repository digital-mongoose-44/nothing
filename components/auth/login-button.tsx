'use client'

import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

const LoginButton = () => {
  const handleMicrosoftSignIn = async () => {
    await signIn.social({
      provider: 'microsoft',
      callbackURL: '/'
    })
  }
  return <Button onClick={handleMicrosoftSignIn}>Sign in with Microsoft</Button>
}

export default LoginButton
