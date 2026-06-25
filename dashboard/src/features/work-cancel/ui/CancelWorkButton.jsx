import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Loader2 } from 'lucide-react'
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
import { cancelWork } from '@/entities/work'

export default function CancelWorkButton({
  workId,
  onDone,
  variant = 'destructive',
  size = 'sm',
  iconOnly = false,
  disabled = false,
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleConfirm = async () => {
    setCancelling(true)
    try {
      await cancelWork(workId)
      toast.success(t('work_actions.cancel_ok'))
      setOpen(false)
      onDone?.()
    } catch (e) {
      toast.error(e?.message || t('work_actions.cancel_err'))
    } finally {
      setCancelling(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={iconOnly ? 'icon' : size}
          disabled={disabled || cancelling}
          title={t('work_actions.cancel_title')}
          className={iconOnly ? 'h-8 w-8' : undefined}
        >
          {cancelling ? <Loader2 className="animate-spin" /> : <X />}
          {!iconOnly && t('work_actions.cancel')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('work_actions.cancel_q')}</AlertDialogTitle>
          <AlertDialogDescription>{t('work_actions.cancel_desc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelling}>{t('work_actions.cancel_dismiss')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={cancelling} variant="destructive">
            {cancelling && <Loader2 className="animate-spin" />}
            {t('work_actions.cancel_confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
