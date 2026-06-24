import { Badge } from '@/shared/ui'
import { getStatusConfig } from '../model/status'

export default function StatusBadge({ status, className }) {
  const cfg = getStatusConfig(status)
  return (
    <Badge variant={cfg.variant} className={className}>
      {cfg.label}
    </Badge>
  )
}
