import { useTranslation } from 'react-i18next'
import { HardDrive } from 'lucide-react'
import { formatBytes, quotaPercent } from '@/entities/work-file'
import { cn } from '@shared/lib/utils'

/** Storage usage bar: used / limit with a fill that turns red when near full. */
export default function QuotaBar({ used, limit }) {
  const { t } = useTranslation()
  const units = t('work_files.units').split(',')
  const pct = quotaPercent(used, limit)
  const near = pct >= 90

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[12px]">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground/70">
          <HardDrive className="h-3.5 w-3.5" />
          {t('work_files.storage')}
        </span>
        <span className="tabular-nums text-muted-foreground">
          {formatBytes(used, { units })} / {formatBytes(limit, { units })}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t('work_files.storage')}
      >
        <div
          className={cn('h-full rounded-full transition-all', near ? 'bg-destructive' : 'bg-primary')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
