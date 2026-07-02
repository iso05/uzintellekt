import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import { resolveValidationError } from '@shared/lib/validation-error'

export function FieldError({ error, className }) {
  const { t } = useTranslation()
  const message = resolveValidationError(t, error)
  if (!message) return null
  return (
    <div
      role="alert"
      className={cn('mt-1 flex items-center gap-1 text-xs text-destructive', className)}
    >
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
