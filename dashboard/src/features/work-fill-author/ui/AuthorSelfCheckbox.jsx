import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/shared/ui'
import { maskName, maskPassport } from '@/shared/lib/input-masks'

/**
 * Pre-fills holder #0 with the current user's identity when checked.
 * Auto-derives checked state from holder[0].passportNo === user passport
 * so existing records (edit mode) reflect the right initial state.
 */
export default function AuthorSelfCheckbox({ user, holders, onApply, onClear, disabled }) {
  const { t } = useTranslation()
  const userPassport = maskPassport(user?.passportSeria || user?.passportNo || '')
  const firstHolderPassport = (holders?.[0]?.passportNo || '').trim().toUpperCase()
  const checked = !!userPassport && firstHolderPassport === userPassport.toUpperCase()

  const canCheck = !!userPassport && !!user?.firstName && !!user?.lastName

  const handleChange = (next) => {
    if (next) {
      onApply({
        passportNo: userPassport,
        firstName: maskName(user.firstName || ''),
        lastName: maskName(user.lastName || ''),
      })
    } else {
      onClear({ passportNo: '', firstName: '', lastName: '' })
    }
  }

  return (
    <label
      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
    >
      <Checkbox
        checked={checked}
        onCheckedChange={handleChange}
        disabled={disabled || !canCheck}
        aria-label={t('form.i_am_author')}
      />
      <span>{t('form.i_am_author')}</span>
      {!canCheck && (
        <span className="ml-1 text-[11px] font-normal text-muted-foreground">
          {t('form.i_am_author_hint')}
        </span>
      )}
    </label>
  )
}
