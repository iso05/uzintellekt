import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Input, Button, toast } from '@/shared/ui'
import { maskName } from '@/shared/lib/input-masks'
import { updateMeField } from '@/entities/user'

export default function PseudonymEdit({ initialValue, onDone, onCancel }) {
  const [value, setValue] = useState(initialValue || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateMeField('pseudonym', value.trim() || null)
      toast.success('Tahallus saqlandi')
      onDone?.(updated)
    } catch (e) {
      toast.error(e?.message || 'Saqlashda xatolik')
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
        placeholder="Tahallus"
        disabled={saving}
        className="h-9"
      />
      <Button size="icon" className="h-9 w-9" onClick={handleSave} disabled={saving} title="Saqlash">
        {saving ? <Loader2 className="animate-spin" /> : <Check />}
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9"
        onClick={onCancel}
        disabled={saving}
        title="Bekor qilish"
      >
        <X />
      </Button>
    </div>
  )
}
