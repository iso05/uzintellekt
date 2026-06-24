import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Skeleton } from '@/shared/ui'
import { ROUTES } from '@/shared/config/routes'
import StatCard from './StatCard'

const STATS = [
  { key: 'total', state: null, icon: FileText, tone: 'primary' },
  { key: 'registered', state: 'REGISTERED', icon: CheckCircle2, tone: 'success' },
  { key: 'pending', state: 'PENDING', icon: Clock, tone: 'warning' },
  { key: 'rejected', state: 'REJECTED', icon: XCircle, tone: 'destructive' },
]

export default function WorksStats({ stats, loading }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s) => (
        <StatCard
          key={s.key}
          icon={s.icon}
          label={t(`stats.${s.key}`)}
          tone={s.tone}
          value={stats[s.key] ?? 0}
          onClick={() => navigate(s.state ? `${ROUTES.WORKS}?state=${s.state}` : ROUTES.WORKS)}
        />
      ))}
    </div>
  )
}
