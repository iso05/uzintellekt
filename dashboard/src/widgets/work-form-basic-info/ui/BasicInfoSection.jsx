import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Input,
  Textarea,
  Label,
  FieldError,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { resolveLocalizedName } from '@shared/lib/localized-name'
import { useDictionaries } from '@/entities/work'

const MAX_NAME = 500
const MAX_DESC = 500

function CharCounter({ value, max = MAX_DESC, t }) {
  const len = (value || '').length
  return (
    <div className="mt-0.5 flex items-center justify-between text-[11.5px] font-medium text-muted-foreground">
      <span>{t ? t('form.max_chars', { max, defaultValue: `Maksimal: ${max} belgi` }) : `Maksimal: ${max} belgi`}</span>
      <span className={cn('tabular-nums font-semibold', len >= max - 25 && 'text-amber-600', len >= max && 'text-destructive font-bold')}>
        {len} / {max}
      </span>
    </div>
  )
}

function Required() {
  return <span className="text-destructive">*</span>
}

export default function BasicInfoSection({
  form,
  fieldErrors,
  onFieldChange,
  onFieldBlur,
  disabled = false,
}) {
  const { workTypes, loading: dictLoading } = useDictionaries()
  const { t } = useTranslation()

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <header className="flex items-center gap-2.5 border-b border-border px-5 py-4 md:px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <FileText className="h-[18px] w-[18px]" />
        </span>
        <div className="flex flex-col">
          <h2 className="m-0 text-[15px] font-bold leading-tight text-foreground">
            {t('form.basic_title')}
          </h2>
          <p className="m-0 text-[12px] text-muted-foreground">{t('form.basic_sub')}</p>
        </div>
      </header>

      <div className="flex flex-col gap-5 p-5 md:p-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="form-field-name">
            {t('form.name_label')} <Required />
          </Label>
          <Input
            id="form-field-name"
            placeholder={t('form.name_ph')}
            value={form.name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            onBlur={(e) => onFieldBlur('name', e.target.value)}
            required
            maxLength={MAX_NAME}
            disabled={disabled}
            className={cn(fieldErrors.name && 'border-destructive bg-destructive/5')}
          />
          <CharCounter value={form.name} max={MAX_NAME} t={t} />
          <FieldError error={fieldErrors.name} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>{t('form.desc_label')}</Label>
          <Textarea
            placeholder={t('form.desc_ph')}
            value={form.description}
            onChange={(e) => onFieldChange('description', e.target.value)}
            maxLength={MAX_DESC}
            disabled={disabled}
            className="min-h-[110px] resize-y"
          />
          <CharCounter value={form.description} max={MAX_DESC} t={t} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="form-field-workTypeId">
            {t('form.type_label')} <Required />
          </Label>
          <Select
            value={String(form.workTypeId || '')}
            onValueChange={(v) => {
              onFieldChange('workTypeId', v)
              onFieldBlur('workTypeId', v)
            }}
            disabled={disabled || dictLoading}
          >
            <SelectTrigger
              id="form-field-workTypeId"
              className={cn(fieldErrors.workTypeId && 'border-destructive bg-destructive/5')}
            >
              <SelectValue placeholder={t('form.type_ph')} />
            </SelectTrigger>
            <SelectContent>
              {workTypes.map((wt) => (
                <SelectItem key={wt.id} value={String(wt.id)}>
                  {resolveLocalizedName(wt.localizedName, wt.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError error={fieldErrors.workTypeId} />
        </div>
      </div>
    </section>
  )
}
