import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { useAuth } from '@/features/auth'
import { getWorksStats, getRecentWorks } from '@/entities/work'
import { ROUTES } from '@/shared/config/routes'
import { Button, toast } from '@/shared/ui'
import { WelcomeCard } from '@/widgets/welcome-card'
import { WorksStats } from '@/widgets/works-stats'
import { RecentWorksTable } from '@/widgets/recent-works-table'

export default function DashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, registered: 0, pending: 0, rejected: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const loadedRef = useRef(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [s, r] = await Promise.all([getWorksStats(), getRecentWorks(5)])
      setStats(s)
      setRecent(r)
    } catch (e) {
      console.error('Dashboard load error:', e)
      toast.error(e?.message || t('dashboard.load_error'))
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    load()
  }, [load])

  const openDetail = useCallback(
    (work) => navigate(ROUTES.WORK_DETAIL(work.id)),
    [navigate]
  )

  return (
    <div className="flex flex-col gap-6">
      <WelcomeCard user={user} />
      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center shadow-soft">
          <p className="text-[14px] font-medium text-muted-foreground">
            {t('dashboard.load_error')}
          </p>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('common.retry')}
          </Button>
        </div>
      ) : (
        <>
          <WorksStats stats={stats} loading={loading} />
          <RecentWorksTable
            works={recent}
            loading={loading}
            onView={openDetail}
          />
        </>
      )}
    </div>
  )
}
