import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send, Loader2 } from 'lucide-react'
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
import { submitWork } from '@/entities/work'

export default function SubmitWorkButton({
  workId,
  onDone,
  variant = 'success',
  size = 'sm',
  iconOnly = false,
  disabled = false,
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await submitWork(workId)
      toast.success(t('work_actions.submit_ok'))
      setOpen(false)
      onDone?.()
    } catch (e) {
      toast.error(e?.message || t('work_actions.submit_err'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={iconOnly ? 'icon' : size}
          disabled={disabled || submitting}
          title={t('work_actions.submit')}
          className={iconOnly ? 'h-8 w-8' : undefined}
        >
          {submitting ? <Loader2 className="animate-spin" /> : <Send />}
          {!iconOnly && t('work_actions.submit')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('work_actions.submit_q')}</AlertDialogTitle>
          <AlertDialogDescription>{t('work_actions.submit_desc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>{t('work_actions.submit_dismiss')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={submitting} variant="success">
            {submitting && <Loader2 className="animate-spin" />}
            {t('work_actions.submit')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
