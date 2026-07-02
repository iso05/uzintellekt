import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/ui'
import { getStatusConfig } from '../model/status'

export default function StatusBadge({ status, className }) {
  const { t } = useTranslation()
  const cfg = getStatusConfig(status)
  const label = t(`work_status.${status}`, { defaultValue: status || t('work_status.unknown') })
  return (
    <Badge variant={cfg.variant} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
