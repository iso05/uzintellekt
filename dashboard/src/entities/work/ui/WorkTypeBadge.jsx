import { Badge } from '@shared/ui'
import { resolveWorkTypeName } from '../model/use-dictionaries'

export default function WorkTypeBadge({ workTypeId, workTypes, className }) {
  return (
    <Badge variant="secondary" className={className}>
      {resolveWorkTypeName(workTypes, workTypeId)}
    </Badge>
  )
}
