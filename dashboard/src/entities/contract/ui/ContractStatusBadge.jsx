import { useTranslation } from 'react-i18next'
import { Badge } from '@/shared/ui'
import { getContractStatusConfig } from '../model/status'

export default function ContractStatusBadge({ status, className }) {
  const { t } = useTranslation()
  const cfg = getContractStatusConfig(status)
  const label = t(`contracts.status.${status}`, { defaultValue: status || t('contracts.status.unknown') })
  return (
    <Badge variant={cfg.variant} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
