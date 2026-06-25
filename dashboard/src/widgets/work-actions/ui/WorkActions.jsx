import { useNavigate } from 'react-router-dom'
import { Pencil, FileText } from 'lucide-react'
import { Button } from '@/shared/ui'
import { getWorkStatus, isEditableState, isCancellableState } from '@/entities/work'
import { ROUTES } from '@/shared/config/routes'
import { SubmitWorkButton } from '@/features/work-submit'
import { CancelWorkButton } from '@/features/work-cancel'

export default function WorkActions({ work, onView, onChanged }) {
  const navigate = useNavigate()
  const status = getWorkStatus(work)
  const editable = isEditableState(status)
  const cancellable = isCancellableState(status)

  return (
    <div className="flex flex-wrap gap-1.5">
      {editable ? (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="Tahrirlash"
          onClick={() => navigate(ROUTES.WORK_EDIT(work.id))}
        >
          <Pencil />
        </Button>
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          title="Batafsil ko'rish"
          onClick={() => onView(work)}
        >
          <FileText />
        </Button>
      )}

      {editable && (
        <SubmitWorkButton
          workId={work.id}
          onDone={onChanged}
          iconOnly
          variant="outline"
          className="text-success hover:text-success"
        />
      )}

      {cancellable && (
        <CancelWorkButton
          workId={work.id}
          onDone={onChanged}
          iconOnly
          variant="outline"
          className="text-destructive hover:text-destructive"
        />
      )}
    </div>
  )
}
