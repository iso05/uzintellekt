import { useNavigate } from 'react-router-dom'
import { Pencil, Eye } from 'lucide-react'
import { Button } from '@shared/ui'
import { getWorkStatus, isEditableState, isDeletableState } from '@/entities/work'
import { ROUTES } from '@/config/routes'
import { SubmitWorkButton } from '@/features/work-submit'
import { DeleteWorkButton } from '@/features/work-delete'

export default function WorkActions({ work, onView, onChanged }) {
  const navigate = useNavigate()
  const status = getWorkStatus(work)
  const editable = isEditableState(status)
  const deletable = isDeletableState(status)

  return (
    <div className="flex flex-wrap gap-1.5">
      {editable ? (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Tahrirlash"
          onClick={() => navigate(ROUTES.WORK_EDIT(work.id))}
        >
          <Pencil />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Ko'rish"
          onClick={() => onView(work)}
        >
          <Eye />
        </Button>
      )}

      {editable && (
        <SubmitWorkButton
          workId={work.id}
          onDone={onChanged}
          iconOnly
          variant="outline"
          className="text-muted-foreground hover:text-success"
        />
      )}

      {deletable && (
        <DeleteWorkButton
          workId={work.id}
          onDone={onChanged}
          iconOnly
          variant="outline"
          className="text-muted-foreground hover:text-destructive"
        />
      )}
    </div>
  )
}
