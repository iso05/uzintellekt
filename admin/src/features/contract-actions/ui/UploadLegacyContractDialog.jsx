import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DatePicker,
  toast,
} from '@shared/ui'
import { uploadLegacyContract, CONTRACT_TYPES } from '@/entities/contract'

const EMPTY = { type: 'MEMBERSHIP', effectiveFrom: '', effectiveUntil: '', signedAt: '' }

function Field({ label, required, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function UploadLegacyContractDialog({ userId, open, onOpenChange, onDone }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [file, setFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setFile(null)
      setErrors({})
      setSubmitting(false)
    }
  }, [open])

  const setVal = (key) => (val) => setForm((f) => ({ ...f, [key]: val }))

  function validate() {
    const errs = {}
    const req = t('user.form.required')
    if (!form.effectiveFrom.trim()) errs.effectiveFrom = req
    if (!form.signedAt.trim()) errs.signedAt = req
    if (!file) errs.document = req
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function onSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      await uploadLegacyContract(userId, {
        type: form.type,
        effectiveFrom: form.effectiveFrom.trim(),
        effectiveUntil: form.effectiveUntil.trim() || undefined,
        signedAt: form.signedAt.trim(),
        document: file,
      })
      toast.success(t('contract.legacy_uploaded'))
      onOpenChange(false)
      onDone?.()
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t('contract.legacy_title')}</DialogTitle>
          <DialogDescription>{t('contract.legacy_desc')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <Field label={t('contract.form.type')}>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTRACT_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    {t(`contract.type.${ct}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('contract.form.effective_from')} required error={errors.effectiveFrom}>
              <DatePicker
                value={form.effectiveFrom}
                onChange={setVal('effectiveFrom')}
                disabled={submitting}
                hasError={Boolean(errors.effectiveFrom)}
              />
            </Field>
            <Field label={t('contract.form.effective_until')} error={errors.effectiveUntil}>
              <DatePicker
                value={form.effectiveUntil}
                onChange={setVal('effectiveUntil')}
                disabled={submitting}
                hasError={Boolean(errors.effectiveUntil)}
              />
            </Field>
          </div>

          <Field label={t('contract.form.signed_at')} required error={errors.signedAt}>
            <DatePicker
              value={form.signedAt}
              onChange={setVal('signedAt')}
              disabled={submitting}
              hasError={Boolean(errors.signedAt)}
            />
          </Field>

          <Field label={t('contract.form.document')} required error={errors.document}>
            <Input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={submitting}
              className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('contract.upload')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
