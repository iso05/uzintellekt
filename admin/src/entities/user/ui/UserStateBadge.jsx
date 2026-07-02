import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/ui'
import { getStateConfig } from '../model/status'

export default function UserStateBadge({ state, className }) {
  const { t } = useTranslation()
  const cfg = getStateConfig(state)
  const label = t(`dashboard.user_state.${state}`, { defaultValue: state })
  return (
    <Badge variant={cfg.variant} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </Badge>
  )
}
