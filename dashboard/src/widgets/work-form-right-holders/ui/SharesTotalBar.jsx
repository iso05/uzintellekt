import { Check, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'

export default function SharesTotalBar({ total, error }) {
  const { t } = useTranslation()
  const ok = total === 100
  const pct = Math.min(100, Math.max(0, Number(total) || 0))

  return (
    <div
      id="right-holders-total"
      className={cn(
        'flex flex-col gap-2.5 rounded-lg border px-4 py-3.5',
        ok ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full',
              ok ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'
            )}
          >
            {ok ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </span>
          <span className={cn('text-[13.5px] font-semibold', ok ? 'text-success' : 'text-warning')}>
            {ok ? t('form.shares_ok') : t('form.shares_title')}
          </span>
        </div>
        <span className={cn('text-[15px] font-bold tabular-nums', ok ? 'text-success' : 'text-warning')}>
          {total}% / 100%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', ok ? 'bg-success' : 'bg-warning')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {error && <div className="text-[12px] font-medium text-destructive">{error}</div>}
    </div>
  )
}
