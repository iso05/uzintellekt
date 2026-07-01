import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  toast,
} from '@/shared/ui'
import { deleteWork } from '@/entities/work'
import { apiErrorMessage } from '@/shared/lib/api-error'

export default function DeleteWorkButton({
  workId,
  onDone,
  variant = 'destructive',
  size = 'sm',
  iconOnly = false,
  disabled = false,
  className,
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    try {
      await deleteWork(workId)
      toast.success(t('work_actions.delete_ok'))
      setOpen(false)
      onDone?.()
    } catch (e) {
      toast.error(apiErrorMessage(e, t, 'work_actions.delete_err'))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={iconOnly ? 'icon' : size}
          disabled={disabled || deleting}
          title={t('work_actions.delete_title')}
          className={`${iconOnly ? 'h-8 w-8 ' : ''}${className ?? ''}`.trim() || undefined}
        >
          {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
          {!iconOnly && t('work_actions.delete')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('work_actions.delete_q')}</AlertDialogTitle>
          <AlertDialogDescription>{t('work_actions.delete_desc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{t('work_actions.delete_dismiss')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleting} variant="destructive">
            {deleting && <Loader2 className="animate-spin" />}
            {t('work_actions.delete_confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
