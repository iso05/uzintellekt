import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getStorageQuota, formatBytes } from '@/entities/work-file'
import { Skeleton } from '@shared/ui'
import QuotaBar from './QuotaBar'

/**
 * Self-contained storage-quota card for the dashboard home. Loads its own data;
 * stays quiet on error (the dashboard already surfaces its own load errors).
 */
export default function StorageQuotaCard() {
  const { t } = useTranslation()
  const units = t('work_files.units').split(',')
  const [quota, setQuota] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    getStorageQuota()
      .then((q) => alive && setQuota(q))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  if (loading) return <Skeleton className="h-[88px] rounded-xl" />
  if (error || !quota) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-5 shadow-soft">
      <QuotaBar used={quota.usedBytes} limit={quota.limitBytes} />
      <p className="text-[12px] text-muted-foreground">
        {t('work_files.remaining', { size: formatBytes(quota.remainingBytes, { units }) })}
      </p>
    </div>
  )
}
