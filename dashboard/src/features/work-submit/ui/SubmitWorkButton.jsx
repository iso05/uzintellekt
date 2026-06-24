import { useState } from 'react'
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
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    try {
      await submitWork(workId)
      toast.success("Asar ko'rib chiqish uchun yuborildi")
      setOpen(false)
      onDone?.()
    } catch (e) {
      toast.error(e?.message || "Asarni yuborishda xatolik")
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
          title="Yuborish"
          className={iconOnly ? 'h-8 w-8' : undefined}
        >
          {submitting ? <Loader2 className="animate-spin" /> : <Send />}
          {!iconOnly && 'Yuborish'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Asarni yuborasizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            Asar ko'rib chiqishga yuboriladi. Yuborilgandan keyin uni tahrirlash mumkin emas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Bekor</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={submitting} variant="success">
            {submitting && <Loader2 className="animate-spin" />}
            Yuborish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
