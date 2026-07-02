import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/ui'
import { getContractTypeConfig } from '../model/status'

export default function ContractTypeBadge({ type, className }) {
  const { t } = useTranslation()
  const cfg = getContractTypeConfig(type)
  const label = t(`contract.type.${type}`, { defaultValue: type })
  return (
    <Badge variant={cfg.variant} className={className}>
      {label}
    </Badge>
  )
}
