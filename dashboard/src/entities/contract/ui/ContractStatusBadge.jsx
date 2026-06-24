import { Badge } from '@/shared/ui'
import { getContractStatusConfig } from '../model/status'

export default function ContractStatusBadge({ status, className }) {
  const cfg = getContractStatusConfig(status)
  return (
    <Badge variant={cfg.variant} className={className}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {cfg.label}
    </Badge>
  )
}
