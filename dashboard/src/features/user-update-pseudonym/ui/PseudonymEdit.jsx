import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Loader2 } from 'lucide-react'
import { Input, Button, toast } from '@shared/ui'
import { maskName } from '@shared/lib/input-masks'
import { updateMeField } from '@/entities/user'

export default function PseudonymEdit({ initialValue, onDone, onCancel }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateMeField('pseudonym', value.trim() || null)
      toast.success(t('profile.pseudonym_saved'))
      onDone?.(updated)
    } catch (e) {
      toast.error(e?.message || t('common.save_error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm items-center gap-2">
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(maskName(e.target.value))}
        placeholder={t('profile.f_pseudonym')}
        disabled={saving}
        className="h-9"
      />
      <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSave} disabled={saving} title={t('common.save')}>
        {saving ? <Loader2 className="animate-spin" /> : <Check />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={onCancel}
        disabled={saving}
        title={t('common.cancel')}
      >
        <X />
      </Button>
    </div>
  )
}
