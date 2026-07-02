import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input, Label, Button, FieldError } from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { AuthorRolesMultiSelect, buildHolderErrorKey } from '@/entities/work'

function Required() {
  return <span className="text-destructive">*</span>
}

export default function HolderCard({
  index,
  holder,
  onChange,
  onBlur,
  onRemove,
  fieldErrors,
  remainingShare,
  totalShare,
  disabled,
  canRemove,
}) {
  const { t } = useTranslation()
  const errKey = (field) => fieldErrors[buildHolderErrorKey(index, field)]

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-[12px] font-bold text-primary">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {index + 1}
          </span>
          {t('form.holder')}
        </span>
        {!disabled && canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            onClick={onRemove}
            type="button"
            title={t('form.remove')}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>{t('form.passport_label')}</Label>
          <Input
            id={`holder-field-${index}-passportNo`}
            placeholder={t('form.passport_ph')}
            value={holder.passportNo}
            onChange={(e) => onChange('passportNo', e.target.value)}
            onBlur={(e) => onBlur('passportNo', e.target.value)}
            maxLength={9}
            disabled={disabled}
            className={cn('font-mono', errKey('passportNo') && 'border-destructive bg-destructive/5')}
          />
          <FieldError error={errKey('passportNo')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('form.first_name_label')}</Label>
          <Input
            id={`holder-field-${index}-firstName`}
            placeholder={t('form.first_name_ph')}
            value={holder.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            onBlur={(e) => onBlur('firstName', e.target.value)}
            disabled={disabled}
            className={cn(errKey('firstName') && 'border-destructive bg-destructive/5')}
          />
          <FieldError error={errKey('firstName')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('form.last_name_label')}</Label>
          <Input
            id={`holder-field-${index}-lastName`}
            placeholder={t('form.last_name_ph')}
            value={holder.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            onBlur={(e) => onBlur('lastName', e.target.value)}
            disabled={disabled}
            className={cn(errKey('lastName') && 'border-destructive bg-destructive/5')}
          />
          <FieldError error={errKey('lastName')} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('form.share_label')}</Label>
          <Input
            id={`holder-field-${index}-sharePercentage`}
            type="text"
            inputMode="decimal"
            maxLength={6}
            placeholder="0.00"
            value={holder.share}
            onChange={(e) => onChange('share', e.target.value)}
            onBlur={(e) => onBlur('share', e.target.value)}
            disabled={disabled}
            className={cn(errKey('sharePercentage') && 'border-destructive bg-destructive/5')}
          />
          {!disabled && (
            <span className="text-[11.5px] font-medium text-muted-foreground">
              {remainingShare > 0
                ? t('form.share_max', { max: remainingShare, free: 100 - totalShare })
                : t('form.share_all_done')}
            </span>
          )}
          <FieldError error={errKey('sharePercentage')} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>
            {t('form.role_label')} <Required />
          </Label>
          <AuthorRolesMultiSelect
            value={holder.authorRoleIds || []}
            onChange={(v) => onChange('authorRoleIds', v)}
            onClose={() => onBlur('authorRoleIds', holder.authorRoleIds || [])}
            disabled={disabled}
            hasError={!!errKey('authorRoles')}
          />
          <FieldError error={errKey('authorRoles')} />
        </div>
      </div>
    </div>
  )
}
