import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/ui'
import { getContractStateConfig } from '../model/status'

export default function ContractStateBadge({ state, className }) {
  const { t } = useTranslation()
  const cfg = getContractStateConfig(state)
  const label = t(`contract.state.${state}`, { defaultValue: state })
  return (
    <Badge variant={cfg.variant} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
