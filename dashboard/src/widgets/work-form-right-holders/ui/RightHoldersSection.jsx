import { Users, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import HolderCard from './HolderCard'
import SharesTotalBar from './SharesTotalBar'

export default function RightHoldersSection({
  rightHolders,
  fieldErrors,
  shareTotal,
  shareTotalError,
  onHolderChange,
  onHolderBlur,
  onAddHolder,
  onRemoveHolder,
  getRemainingShareFor,
  disabled = false,
  headerExtra,
}) {
  const { t } = useTranslation()
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Users className="h-[18px] w-[18px]" />
          </span>
          <div className="flex flex-col">
            <h2 className="m-0 text-[15px] font-bold leading-tight text-foreground">
              {t('form.holders_title')}
            </h2>
            <p className="m-0 text-[12px] text-muted-foreground">{t('form.holders_sub')}</p>
          </div>
        </div>
        {headerExtra}
      </header>

      <div className="flex flex-col gap-3 p-5 md:p-6">
        {rightHolders.map((rh, idx) => (
          <HolderCard
            key={idx}
            index={idx}
            holder={rh}
            fieldErrors={fieldErrors}
            remainingShare={getRemainingShareFor(idx)}
            totalShare={shareTotal}
            disabled={disabled}
            canRemove={rightHolders.length > 1}
            onChange={(field, value) => onHolderChange(idx, field, value)}
            onBlur={(field, value) => onHolderBlur(idx, field, value)}
            onRemove={() => onRemoveHolder(idx)}
          />
        ))}

        <SharesTotalBar total={shareTotal} error={shareTotalError} />

        {!disabled && (
          <Button
            variant="outline"
            type="button"
            onClick={onAddHolder}
            className="mt-1 w-full border-2 border-dashed border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            {t('form.add_holder')}
          </Button>
        )}
      </div>
    </section>
  )
}
