import { useEffect, useState } from 'react'
import AppRouter from './router/AppRouter'
import { AuthProvider } from './hooks/useAuth'
import { validateOneIDConfig } from './utils/configValidator'
import { Toaster } from '@/shared/ui'

function App() {
  const [configError, setConfigError] = useState(false)

  useEffect(() => {
    try {
      validateOneIDConfig()
    } catch {
      setConfigError(true)
    }
  }, [])

  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
        <div className="max-w-md space-y-3">
          <h1 className="text-2xl font-semibold text-foreground">Konfiguratsiya xatosi</h1>
          <p className="text-muted-foreground">Ilova konfiguratsiyasi noto'g'ri.</p>
          <p className="text-muted-foreground">Iltimos, administratorga murojaat qiling.</p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <AppRouter />
      <Toaster />
    </AuthProvider>
  )
}

export default App
