import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/features/auth'
import { getWorksStats, getRecentWorks, getWork, WorkDetailDialog } from '@/entities/work'
import { toast } from '@/shared/ui'
import { WelcomeCard } from '@/widgets/welcome-card'
import { WorksStats } from '@/widgets/works-stats'
import { RecentWorksTable } from '@/widgets/recent-works-table'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ total: 0, registered: 0, pending: 0, rejected: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailWork, setDetailWork] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    Promise.all([getWorksStats(), getRecentWorks(5)])
      .then(([s, r]) => {
        setStats(s)
        setRecent(r)
      })
      .catch((e) => console.error('Dashboard load error:', e))
      .finally(() => setLoading(false))
  }, [])

  const openDetail = useCallback(async (work) => {
    setDetailLoading(true)
    try {
      const full = await getWork(work.id)
      setDetailWork(full)
    } catch (e) {
      toast.error(e?.message || 'Tafsilotlarni yuklashda xatolik')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <WelcomeCard user={user} />
      <WorksStats stats={stats} loading={loading} />
      <RecentWorksTable works={recent} loading={loading || detailLoading} onView={openDetail} />
      <WorkDetailDialog
        work={detailWork}
        open={!!detailWork}
        onOpenChange={(o) => !o && setDetailWork(null)}
      />
    </div>
  )
}
