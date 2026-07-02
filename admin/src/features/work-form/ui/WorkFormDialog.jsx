import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2 } from 'lucide-react'
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
import { createWorkForUser, updateWork } from '@/entities/work'
import { useWorkTypeOptions, useAuthorRoleOptions } from '@/entities/dictionary'
import RolesMultiSelect from './RolesMultiSelect'

const emptyHolder = () => ({ lastName: '', firstName: '', passportNo: '', sharePercentage: '', authorRoles: [] })

function holdersFromWork(work) {
  const rhs = work?.rightHolders || []
  if (!rhs.length) return [emptyHolder()]
  return rhs.map((rh) => ({
    lastName: rh.lastName || '',
    firstName: rh.firstName || '',
    passportNo: rh.passportNo || '',
    sharePercentage: rh.sharePercentage != null ? String(rh.sharePercentage) : '',
    authorRoles: rh.authorRoleIds || rh.authorRoles || [],
  }))
}

/**
 * Create (mode='create', needs userId) or edit (mode='edit', needs work) a work
 * with a dynamic list of right holders. Returns the saved work via onDone.
 */
export default function WorkFormDialog({ mode = 'create', userId, work, open, onOpenChange, onDone }) {
  const { t } = useTranslation()
  const typeOptions = useWorkTypeOptions()
  const roleOptions = useAuthorRoleOptions()

  const [name, setName] = useState('')
  const [workTypeId, setWorkTypeId] = useState('')
  const [description, setDescription] = useState('')
  const [holders, setHolders] = useState([emptyHolder()])
  const [errors, setErrors] = useState({ holders: [] })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && work) {
      setName(work.name || '')
      setWorkTypeId(work.workTypeId != null ? String(work.workTypeId) : '')
      setDescription(work.description || '')
      setHolders(holdersFromWork(work))
    } else {
      setName('')
      setWorkTypeId('')
      setDescription('')
      setHolders([emptyHolder()])
    }
    setErrors({ holders: [] })
    setSubmitting(false)
  }, [open, mode, work])

  const shareTotal = useMemo(
    () => holders.reduce((sum, h) => sum + (Number(h.sharePercentage) || 0), 0),
    [holders]
  )

  const setHolder = (i, key, value) =>
    setHolders((hs) => hs.map((h, idx) => (idx === i ? { ...h, [key]: value } : h)))

  const addHolder = () => setHolders((hs) => [...hs, emptyHolder()])
  const removeHolder = (i) => setHolders((hs) => hs.filter((_, idx) => idx !== i))

  function validate() {
    const errs = { holders: holders.map(() => ({})) }
    if (!name.trim()) errs.name = true
    if (!workTypeId) errs.workTypeId = true
    holders.forEach((h, i) => {
      if (!h.lastName.trim()) errs.holders[i].lastName = true
      if (!h.firstName.trim()) errs.holders[i].firstName = true
      if (!h.passportNo.trim()) errs.holders[i].passportNo = true
      if (!(Number(h.sharePercentage) > 0)) errs.holders[i].sharePercentage = true
      if (!h.authorRoles.length) errs.holders[i].authorRoles = true
    })
    if (Math.round(shareTotal) !== 100) errs.shareTotal = true
    setErrors(errs)
    const holderOk = errs.holders.every((e) => Object.keys(e).length === 0)
    return !errs.name && !errs.workTypeId && !errs.shareTotal && holderOk
  }

  function buildPayload() {
    return {
      name: name.trim(),
      description: description.trim() || undefined,
      workTypeId: Number(workTypeId),
      rightHolders: holders.map((h) => ({
        passportNo: h.passportNo.trim(),
        firstName: h.firstName.trim(),
        lastName: h.lastName.trim(),
        sharePercentage: Number(h.sharePercentage),
        authorRoles: h.authorRoles,
      })),
    }
  }

  async function onSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = buildPayload()
      const saved =
        mode === 'edit'
          ? await updateWork(work.id, payload)
          : await createWorkForUser(userId, payload)
      toast.success(t(mode === 'edit' ? 'work.form.updated_toast' : 'work.form.created_toast'))
      onOpenChange(false)
      onDone?.(saved)
    } catch (err) {
      toast.error(err?.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const he = (i, key) => errors.holders[i]?.[key]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{t(mode === 'edit' ? 'work.form.edit_title' : 'work.form.create_title')}</DialogTitle>
          <DialogDescription>{t('work.form.desc')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label>
              {t('work.form.name')}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              className={errors.name ? 'border-destructive' : ''}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              {t('work.form.type')}
              <span className="text-destructive"> *</span>
            </Label>
            <Select value={workTypeId} onValueChange={setWorkTypeId}>
              <SelectTrigger className={errors.workTypeId ? 'border-destructive' : ''}>
                <SelectValue placeholder={t('work.form.select_type')} />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('work.form.description')}</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={submitting} />
          </div>

          {/* Right holders */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>
                {t('work.rightholders')}
                <span className="text-destructive"> *</span>
              </Label>
              <span className={cn('text-[12px] font-medium', Math.round(shareTotal) === 100 ? 'text-success' : 'text-warning')}>
                {t('work.form.share_total', { total: shareTotal })}
              </span>
            </div>
            {errors.shareTotal && (
              <span className="text-[12px] font-medium text-destructive">{t('work.form.share_error')}</span>
            )}

            {holders.map((h, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-muted-foreground">
                    {t('work.form.holder', { n: i + 1 })}
                  </span>
                  {holders.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => removeHolder(i)}
                      aria-label={t('work.form.remove_holder')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    placeholder={t('user.form.last_name')}
                    value={h.lastName}
                    onChange={(e) => setHolder(i, 'lastName', e.target.value)}
                    disabled={submitting}
                    className={he(i, 'lastName') ? 'border-destructive' : ''}
                  />
                  <Input
                    placeholder={t('user.form.first_name')}
                    value={h.firstName}
                    onChange={(e) => setHolder(i, 'firstName', e.target.value)}
                    disabled={submitting}
                    className={he(i, 'firstName') ? 'border-destructive' : ''}
                  />
                  <Input
                    placeholder={t('user.form.passport')}
                    value={h.passportNo}
                    onChange={(e) => setHolder(i, 'passportNo', e.target.value)}
                    disabled={submitting}
                    className={he(i, 'passportNo') ? 'border-destructive' : ''}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder={t('work.form.share')}
                    value={h.sharePercentage}
                    onChange={(e) => setHolder(i, 'sharePercentage', e.target.value)}
                    disabled={submitting}
                    className={he(i, 'sharePercentage') ? 'border-destructive' : ''}
                  />
                </div>
                <RolesMultiSelect
                  options={roleOptions}
                  value={h.authorRoles}
                  onChange={(v) => setHolder(i, 'authorRoles', v)}
                  disabled={submitting}
                  invalid={he(i, 'authorRoles')}
                />
              </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addHolder} className="w-fit">
              <Plus className="h-4 w-4" />
              {t('work.form.add_holder')}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t(mode === 'edit' ? 'user.form.save' : 'work.form.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
