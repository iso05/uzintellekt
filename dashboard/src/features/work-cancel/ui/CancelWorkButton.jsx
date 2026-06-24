import { useState } from 'react'
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
  const [open, setOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const handleConfirm = async () => {
    setCancelling(true)
    try {
      await cancelWork(workId)
      toast.success('Asar bekor qilindi')
      setOpen(false)
      onDone?.()
    } catch (e) {
      toast.error(e?.message || 'Asarni bekor qilishda xatolik')
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
          title="Bekor qilish"
          className={iconOnly ? 'h-8 w-8' : undefined}
        >
          {cancelling ? <Loader2 className="animate-spin" /> : <X />}
          {!iconOnly && 'Bekor'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Asarni bekor qilasizmi?</AlertDialogTitle>
          <AlertDialogDescription>
            Bu amalni qaytarib bo'lmaydi. Asar holati "Bekor qilingan" bo'lib o'zgartiriladi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={cancelling}>Yopish</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={cancelling} variant="destructive">
            {cancelling && <Loader2 className="animate-spin" />}
            Bekor qilish
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
