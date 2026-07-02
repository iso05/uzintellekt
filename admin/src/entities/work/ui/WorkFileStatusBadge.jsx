import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/ui'
import { getFileStateConfig } from '../model/status'

export default function WorkFileStatusBadge({ state, className }) {
  const { t } = useTranslation()
  const cfg = getFileStateConfig(state)
  const label = t(`file_state.${state}`, { defaultValue: state })
  return (
    <Badge variant={cfg.variant} className={className}>
      {label}
    </Badge>
  )
}
