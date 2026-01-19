import { LoginButton } from '@/components/auth'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold">Radio Traffic Chat</h1>
        <p className="text-muted-foreground">Sign in to access the application</p>
        <LoginButton />
      </div>
    </div>
  )
}
