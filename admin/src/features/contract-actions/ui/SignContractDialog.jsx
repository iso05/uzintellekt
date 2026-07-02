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
import { signContract, CONTRACT_TYPES } from '@/entities/contract'
import { parsePhones, joinPhones } from '@/entities/user'

/**
 * Sign a contract on behalf of a user. Contact fields prefill from the user;
 * a signature image is required (multipart upload).
 */
export default function SignContractDialog({ user, open, onOpenChange, onDone }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ contractType: 'MEMBERSHIP', pseudonym: '', address: '', phones: '' })
  const [signature, setSignature] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open && user) {
      setForm({
        contractType: 'MEMBERSHIP',
        pseudonym: user.pseudonym || '',
        address: user.address || '',
        phones: joinPhones(user.phones),
      })
      setSignature(null)
      setErrors({})
      setSubmitting(false)
    }
  }, [open, user])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function validate() {
    const errs = {}
    const req = t('user.form.required')
    if (!form.address.trim()) errs.address = req
    if (!parsePhones(form.phones).length) errs.phones = req
    if (!signature) errs.signature = req
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function onSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      await signContract(user.id, {
        contractType: form.contractType,
        pseudonym: form.pseudonym.trim() || undefined,
        address: form.address.trim(),
        phones: parsePhones(form.phones),
        signatureImage: signature,
      })
      toast.success(t('contract.signed_toast'))
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
          <DialogTitle>{t('contract.sign_title')}</DialogTitle>
          <DialogDescription>{t('contract.sign_desc')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label>{t('contract.form.type')}</Label>
            <Select value={form.contractType} onValueChange={(v) => setForm((f) => ({ ...f, contractType: v }))}>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('user.form.pseudonym')}</Label>
            <Input value={form.pseudonym} onChange={set('pseudonym')} disabled={submitting} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {t('user.form.phones')}
              <span className="text-destructive"> *</span>
            </Label>
            <Input value={form.phones} onChange={set('phones')} placeholder="998901234567" disabled={submitting} />
            {errors.phones && <p className="text-xs text-destructive">{errors.phones}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {t('user.form.address')}
              <span className="text-destructive"> *</span>
            </Label>
            <Textarea rows={2} value={form.address} onChange={set('address')} disabled={submitting} />
            {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {t('contract.form.signature')}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setSignature(e.target.files?.[0] || null)}
              disabled={submitting}
              className="cursor-pointer file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-sm"
            />
            {errors.signature && <p className="text-xs text-destructive">{errors.signature}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('contract.sign')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
