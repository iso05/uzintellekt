import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Loader2 } from 'lucide-react'
import { Input, Button, FieldError, toast } from '@/shared/ui'
import { maskPhone } from '@/shared/lib/input-masks'
import { validatePhone } from '@/shared/lib/validators'
import { updateMeField } from '@/entities/user'

function PhoneRow({ label, value, onChange, error, onBlur, disabled, optional }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="w-12 shrink-0 text-xs text-muted-foreground">{label}:</span>
        <div className="relative flex-1">
          <Input
            type="tel"
            inputMode="numeric"
            maxLength={12}
            value={value}
            onChange={(e) => onChange(maskPhone(e.target.value))}
            onBlur={onBlur}
            onFocus={(e) => {
              if (!e.target.value) onChange('998')
            }}
            placeholder={optional ? t('profile.phone2_ph') : t('profile.phone1_ph')}
            disabled={disabled}
            className="h-9 pr-9"
          />
          {value && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onChange('')}
              title={t('common.clear')}
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
            >
              <X />
            </Button>
          )}
        </div>
      </div>
      <FieldError error={error} />
    </div>
  )
}

export default function PhonesEdit({ initialPhones = [], onDone, onCancel }) {
  const { t } = useTranslation()
  const [phone1, setPhone1] = useState(initialPhones[0] || '')
  const [phone2, setPhone2] = useState(initialPhones[1] || '')
  const [phone1Err, setPhone1Err] = useState(null)
  const [phone2Err, setPhone2Err] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const p1Err = validatePhone(phone1)
    setPhone1Err(p1Err)
    if (p1Err) return

    let p2 = ''
    if (phone2.trim()) {
      const p2Err = validatePhone(phone2)
      setPhone2Err(p2Err)
      if (p2Err) return
      p2 = phone2.trim()
    } else {
      setPhone2Err(null)
    }

    const phones = [phone1.trim(), p2].filter(Boolean)
    setSaving(true)
    try {
      const updated = await updateMeField('phones', phones)
      toast.success(t('profile.phones_saved'))
      onDone?.(updated)
    } catch (e) {
      toast.error(e?.message || t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }

  const canSave = !saving && !phone1Err && !phone2Err && phone1.trim().length > 0

  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <PhoneRow
        label="Tel 1"
        value={phone1}
        onChange={(v) => {
          setPhone1(v)
          if (phone1Err) setPhone1Err(null)
        }}
        onBlur={(e) => setPhone1Err(validatePhone(e.target.value))}
        error={phone1Err}
        disabled={saving}
      />
      <PhoneRow
        label="Tel 2"
        value={phone2}
        onChange={(v) => {
          setPhone2(v)
          if (phone2Err) setPhone2Err(null)
        }}
        onBlur={(e) => setPhone2Err(e.target.value ? validatePhone(e.target.value) : null)}
        error={phone2Err}
        disabled={saving}
        optional
      />

      <div className="mt-1 flex justify-end gap-1.5">
        <Button size="icon" className="h-9 w-9" onClick={handleSave} disabled={!canSave} title={t('common.save')}>
          {saving ? <Loader2 className="animate-spin" /> : <Check />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={onCancel}
          disabled={saving}
          title={t('common.cancel')}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
