import { useTranslation } from 'react-i18next'
import { Badge } from '@shared/ui'
import { getRoleConfig } from '../model/status'

export default function UserRoleBadge({ role, className }) {
  const { t } = useTranslation()
  const cfg = getRoleConfig(role)
  const label = t(`role.${(role || '').toLowerCase()}`, { defaultValue: role })
  return (
    <Badge variant={cfg.variant} className={className}>
      {label}
    </Badge>
  )
}
