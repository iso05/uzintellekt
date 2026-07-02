import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Send } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  Button,
  toast,
} from '@shared/ui'
import { submitWork } from '@/entities/work'

// Submit a draft/rejected work for review, with a confirmation step.
export default function SubmitWorkButton({ work, onDone }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true)
    try {
      await submitWork(work.id)
      toast.success(t('work.submit.submitted_toast'))
      onDone?.()
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={busy}>
          <Send className="h-4 w-4" />
          {t('work.submit.action')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('work.submit.title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('work.submit.confirm', { name: work?.name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={run}>{t('work.submit.action')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
