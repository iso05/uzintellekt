import { useNavigate } from 'react-router-dom'
import { FileText, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Skeleton } from '@/shared/ui'
import { ROUTES } from '@/shared/config/routes'
import StatCard from './StatCard'

const STATS = [
  { key: 'total', state: null, icon: FileText, label: 'Jami asarlar', tone: 'primary' },
  { key: 'registered', state: 'REGISTERED', icon: CheckCircle2, label: 'Tasdiqlangan', tone: 'success' },
  { key: 'pending', state: 'PENDING', icon: Clock, label: "Ko'rib chiqilmoqda", tone: 'warning' },
  { key: 'rejected', state: 'REJECTED', icon: XCircle, label: 'Rad etilgan', tone: 'destructive' },
]

export default function WorksStats({ stats, loading }) {
  const navigate = useNavigate()

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
          label={s.label}
          tone={s.tone}
          value={stats[s.key] ?? 0}
          onClick={() => navigate(s.state ? `${ROUTES.WORKS}?state=${s.state}` : ROUTES.WORKS)}
        />
      ))}
    </div>
  )
}
