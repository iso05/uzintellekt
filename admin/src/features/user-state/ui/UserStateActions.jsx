import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Ban, CheckCircle2 } from 'lucide-react'
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
import { blockUser, activateUser, canBlock, canActivate, getFullName } from '@/entities/user'

/**
 * Block / activate controls with a confirmation step. Only the action valid for
 * the current state is shown; DELETED accounts offer neither.
 */
export default function UserStateActions({ user, onChanged }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)

  async function run(action) {
    setBusy(true)
    try {
      if (action === 'block') await blockUser(user.id)
      else await activateUser(user.id)
      toast.success(t(action === 'block' ? 'user.blocked_toast' : 'user.activated_toast'))
      onChanged?.()
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setBusy(false)
    }
  }

  const name = getFullName(user)

  if (canBlock(user.state)) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={busy}>
            <Ban className="h-4 w-4" />
            {t('user.block')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('user.block_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('user.block_confirm', { name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run('block')}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('user.block')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  if (canActivate(user.state)) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="success" disabled={busy}>
            <CheckCircle2 className="h-4 w-4" />
            {t('user.activate')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('user.activate_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('user.activate_confirm', { name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run('activate')}
              className="bg-success text-success-foreground hover:bg-success/90"
            >
              {t('user.activate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return null
}
