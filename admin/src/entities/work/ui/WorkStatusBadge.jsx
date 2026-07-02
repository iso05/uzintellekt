import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/ui'
import { getStatusConfig } from '../model/status'

export default function WorkStatusBadge({ status, className }) {
  const { t } = useTranslation()
  const cfg = getStatusConfig(status)
  const label = t(`dashboard.work_status.${status}`, { defaultValue: status })
  return (
    <Badge variant={cfg.variant} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
