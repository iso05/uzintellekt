import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Textarea,
  Label,
  toast,
} from '@shared/ui'
import { decideWork } from '@/entities/work'

/**
 * Approve/reject dialog. `decision` ('APPROVE' | 'REJECT') is chosen by the
 * caller (two buttons on the detail page). A rejection reason is mandatory;
 * an approval note is optional. On success it toasts and calls onDecided().
 */
export default function DecideWorkDialog({ work, decision, open, onOpenChange, onDecided }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [error, setError] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isReject = decision === 'REJECT'

  // Reset the form whenever the dialog is (re)opened for a decision.
  useEffect(() => {
    if (open) {
      setReason('')
      setError(false)
      setSubmitting(false)
    }
  }, [open, decision])

  async function onConfirm() {
    if (isReject && !reason.trim()) {
      setError(true)
      return
    }
    setSubmitting(true)
    try {
      await decideWork(work.id, { decision, reason: reason.trim() || undefined })
      toast.success(t(isReject ? 'decide.success_rejected' : 'decide.success_approved'))
      onOpenChange(false)
      onDecided?.()
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(isReject ? 'decide.reject_title' : 'decide.approve_title')}
          </DialogTitle>
          <DialogDescription>
            {work?.name} — {t(isReject ? 'decide.reject_desc' : 'decide.approve_desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 py-1">
          <Label htmlFor="decide-reason">
            {t(isReject ? 'decide.reason' : 'decide.note')}
            {isReject && <span className="text-destructive"> *</span>}
          </Label>
          <Textarea
            id="decide-reason"
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              if (error) setError(false)
            }}
            placeholder={t(isReject ? 'decide.reason_ph' : 'decide.note_ph')}
            disabled={submitting}
            aria-invalid={error}
          />
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {t('decide.reason_required')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            variant={isReject ? 'destructive' : 'success'}
            onClick={onConfirm}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t(isReject ? 'decide.reject' : 'decide.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
