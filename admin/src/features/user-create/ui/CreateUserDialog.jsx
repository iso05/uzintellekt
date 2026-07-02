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
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { createUser, parsePhones } from '@/entities/user'

const EMPTY = {
  type: 'INDIVIDUAL',
  lastName: '',
  firstName: '',
  middleName: '',
  pinfl: '',
  passportSeria: '',
  birthDate: '',
  legalName: '',
  inn: '',
  pseudonym: '',
  phones: '',
  address: '',
}

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

export default function CreateUserDialog({ open, onOpenChange, onCreated }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(EMPTY)
      setErrors({})
      setSubmitting(false)
    }
  }, [open])

  const isLegal = form.type === 'LEGAL'
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const errs = {}
    if (!form.address.trim()) errs.address = t('user.form.required')
    if (isLegal) {
      if (!form.legalName.trim()) errs.legalName = t('user.form.required')
    } else {
      if (!form.firstName.trim()) errs.firstName = t('user.form.required')
      if (!form.lastName.trim()) errs.lastName = t('user.form.required')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function buildPayload() {
    const payload = { type: form.type, address: form.address.trim() }
    const opt = (k) => {
      const v = form[k].trim()
      if (v) payload[k] = v
    }
    if (isLegal) {
      opt('legalName')
      opt('inn')
    } else {
      opt('lastName')
      opt('firstName')
      opt('middleName')
      opt('pinfl')
      opt('passportSeria')
      opt('birthDate')
    }
    opt('pseudonym')
    const phones = parsePhones(form.phones)
    if (phones.length) payload.phones = phones
    return payload
  }

  async function onSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const created = await createUser(buildPayload())
      toast.success(t('user.created_toast'))
      onOpenChange(false)
      onCreated?.(created)
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn('max-h-[88vh] overflow-y-auto sm:max-w-[560px]')}>
        <DialogHeader>
          <DialogTitle>{t('user.create_title')}</DialogTitle>
          <DialogDescription>{t('user.create_desc')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <Field label={t('user.form.type')}>
            <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">{t('user.form.individual')}</SelectItem>
                <SelectItem value="LEGAL">{t('user.form.legal')}</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {isLegal ? (
            <>
              <Field label={t('user.form.legal_name')} required error={errors.legalName}>
                <Input value={form.legalName} onChange={set('legalName')} disabled={submitting} />
              </Field>
              <Field label={t('user.form.inn')}>
                <Input value={form.inn} onChange={set('inn')} disabled={submitting} />
              </Field>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('user.form.last_name')} required error={errors.lastName}>
                  <Input value={form.lastName} onChange={set('lastName')} disabled={submitting} />
                </Field>
                <Field label={t('user.form.first_name')} required error={errors.firstName}>
                  <Input value={form.firstName} onChange={set('firstName')} disabled={submitting} />
                </Field>
              </div>
              <Field label={t('user.form.middle_name')}>
                <Input value={form.middleName} onChange={set('middleName')} disabled={submitting} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('user.form.pinfl')}>
                  <Input value={form.pinfl} onChange={set('pinfl')} disabled={submitting} />
                </Field>
                <Field label={t('user.form.passport')}>
                  <Input value={form.passportSeria} onChange={set('passportSeria')} disabled={submitting} />
                </Field>
              </div>
              <Field label={t('user.form.birth_date')}>
                <Input
                  value={form.birthDate}
                  onChange={set('birthDate')}
                  placeholder="дд.мм.гггг"
                  disabled={submitting}
                />
              </Field>
            </>
          )}

          <Field label={t('user.form.pseudonym')}>
            <Input value={form.pseudonym} onChange={set('pseudonym')} disabled={submitting} />
          </Field>
          <Field label={t('user.form.phones')}>
            <Input
              value={form.phones}
              onChange={set('phones')}
              placeholder="998901234567, 998907654321"
              disabled={submitting}
            />
          </Field>
          <Field label={t('user.form.address')} required error={errors.address}>
            <Textarea rows={2} value={form.address} onChange={set('address')} disabled={submitting} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('user.form.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
