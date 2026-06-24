import { useEffect, useState } from 'react'
import AppRouter from './router/AppRouter'
import { AuthProvider } from './hooks/useAuth'
import { validateOneIDConfig } from './utils/configValidator'

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #3730a3 0%, #5b21b6 100%)',
          color: '#fff',
          textAlign: 'center',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div>
          <h1>⚠️ Konfiguratsiya xatosi</h1>
          <p>Ilova konfiguratsiyasi noto'g'ri.</p>
          <p>Iltimos, administratorga murojaat qiling.</p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
