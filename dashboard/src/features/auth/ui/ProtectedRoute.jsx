import { Loader2, AlertTriangle } from 'lucide-react'
import { useAuth } from '../model/use-auth'

export default function ProtectedRoute({ children }) {
  const { user, loading, authError } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-5">
        {authError ? (
          <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-9 py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="m-0 text-base font-bold text-destructive">
              Kirish amalga oshmadi
            </p>
            <p className="m-0 text-sm leading-relaxed text-foreground/70">
              {authError}
            </p>
            <p className="m-0 text-xs text-muted-foreground">
              Login sahifasiga qaytarilmoqda...
            </p>
          </div>
        ) : (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="m-0 text-sm text-muted-foreground">Tekshirilmoqda...</p>
          </>
        )}
      </div>
    )
  }

  if (!user) return null

  return children
}
