import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, X } from 'lucide-react'
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
  FieldError,
  DatePicker,
  toast,
} from '@shared/ui'
import { cn } from '@shared/lib/utils'
import { maskPhone, maskDigitsOnly, maskPassportSeria } from '@shared/lib/input-masks'
import {
  validatePhone,
  validatePinfl,
  validatePassportSeria,
  validateBirthDate,
  normalizePassportName,
} from '@shared/lib/validators'
import {
  loadGeo,
  buildAddress,
  findRegionByName,
  findDistrictByName,
  districtsOfRegion,
} from '@shared/api'
import { createUser } from '@/entities/user'

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
  street: '',
  house: '',
}

// ── Field wrapper ──────────────────────────────────────────────────
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

// ── Masked phone input ─────────────────────────────────────────────
function PhoneField({ value, onChange, onBlur, error, disabled, optional }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="relative">
        <Input
          type="tel"
          inputMode="numeric"
          maxLength={12}
          value={value}
          onChange={(e) => onChange(maskPhone(e.target.value))}
          onFocus={(e) => { if (!e.target.value) onChange('998') }}
          onBlur={onBlur}
          placeholder={optional ? '998907654321' : '998901234567'}
          disabled={disabled}
          className="pr-9"
        />
        {value && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange('')}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <FieldError error={error} />
    </div>
  )
}

// ── Birth date: auto-insert dots, clamp day ≤ 31 and month ≤ 12 ───
function maskBirthDate(raw) {
  let d = raw.replace(/[^0-9]/g, '').slice(0, 8)

  // Clamp day (digits 0-1): first digit max 3; two digits max 31
  if (d.length >= 1 && Number(d[0]) > 3) d = '3' + d.slice(1)
  if (d.length >= 2 && Number(d.slice(0, 2)) > 31) d = '31' + d.slice(2)
  if (d.length >= 2 && Number(d.slice(0, 2)) < 1) d = '01' + d.slice(2)

  // Clamp month (digits 2-3): first digit max 1; two digits max 12
  if (d.length >= 3 && Number(d[2]) > 1) d = d.slice(0, 2) + '1' + d.slice(3)
  if (d.length >= 4 && Number(d.slice(2, 4)) > 12) d = d.slice(0, 2) + '12' + d.slice(4)
  if (d.length >= 4 && Number(d.slice(2, 4)) < 1) d = d.slice(0, 2) + '01' + d.slice(4)

  if (d.length <= 2) return d
  if (d.length <= 4) return `${d.slice(0, 2)}.${d.slice(2)}`
  return `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`
}

// ─────────────────────────────────────────────────────────────────
export default function CreateUserDialog({ open, onOpenChange, onCreated }) {
  const { t } = useTranslation()

  // Text fields
  const [form, setForm] = useState(EMPTY)

  // Phones
  const [phone1, setPhone1] = useState('')
  const [phone2, setPhone2] = useState('')
  const [phone1Err, setPhone1Err] = useState(null)
  const [phone2Err, setPhone2Err] = useState(null)

  // Geo
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [regionId, setRegionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)

  // Field errors
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Load geo on first open
  useEffect(() => {
    if (!open) return
    // Reset form state
    setForm(EMPTY)
    setPhone1('')
    setPhone2('')
    setPhone1Err(null)
    setPhone2Err(null)
    setRegionId('')
    setDistrictId('')
    setErrors({})
    setSubmitting(false)

    let alive = true
    setGeoLoading(true)
    setGeoError(null)
    loadGeo()
      .then(({ regions: r, districts: d }) => {
        if (!alive) return
        setRegions(r)
        setDistricts(d)
      })
      .catch(() => {
        if (alive) setGeoError(t('user.form.geo_error'))
      })
      .finally(() => {
        if (alive) setGeoLoading(false)
      })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isLegal = form.type === 'LEGAL'
  const districtsForRegion = districtsOfRegion(districts, regionId)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // ── Validation ──────────────────────────────────────────────────
  function validate() {
    const errs = {}

    if (isLegal) {
      if (!form.legalName.trim()) errs.legalName = t('user.form.required')
    } else {
      if (!form.firstName.trim()) errs.firstName = t('user.form.required')
      if (!form.lastName.trim()) errs.lastName = t('user.form.required')
    }

    // Address: region + district required, street required
    if (!regionId) errs.region = t('user.form.required')
    if (!districtId) errs.district = t('user.form.required')
    if (!form.street.trim()) errs.street = t('user.form.required')

    // Optional fields with format validation
    const pinflErr = form.pinfl.trim() ? validatePinfl(form.pinfl) : null
    if (pinflErr) errs.pinfl = pinflErr

    const passportErr = validatePassportSeria(form.passportSeria)
    if (passportErr) errs.passportSeria = passportErr

    const birthErr = validateBirthDate(form.birthDate)
    if (birthErr) errs.birthDate = birthErr

    // Phones (both optional, but validated if filled)
    const p1Err = phone1.trim() ? validatePhone(phone1) : null
    const p2Err = phone2.trim() ? validatePhone(phone2) : null
    setPhone1Err(p1Err)
    setPhone2Err(p2Err)

    setErrors(errs)
    return Object.keys(errs).length === 0 && !p1Err && !p2Err
  }

  // ── Payload ─────────────────────────────────────────────────────
  function buildPayload() {
    // Build address string from geo selection
    const region = regions.find((r) => String(r.id) === regionId)
    const district = districts.find((d) => String(d.id) === districtId)
    const address = buildAddress({
      regionName: region?.name ?? '',
      districtName: district?.name ?? '',
      street: form.street.trim(),
      house: form.house.trim(),
    }).replace(/,\s*$/, '') // remove trailing ", " if house empty

    const payload = { type: form.type, address }

    const opt = (k, v) => { if (v?.trim()) payload[k] = v.trim() }

    if (isLegal) {
      opt('legalName', form.legalName)
      opt('inn', form.inn)
    } else {
      opt('lastName', normalizePassportName(form.lastName))
      opt('firstName', normalizePassportName(form.firstName))
      opt('middleName', normalizePassportName(form.middleName))
      opt('pinfl', form.pinfl)
      opt('passportSeria', form.passportSeria)
      opt('birthDate', form.birthDate)
    }
    opt('pseudonym', form.pseudonym)

    const phones = [phone1.trim(), phone2.trim()].filter(Boolean)
    if (phones.length) payload.phones = phones

    return payload
  }

  // ── Submit ──────────────────────────────────────────────────────
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
          {/* Type selector */}
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

          {/* Identity fields */}
          {isLegal ? (
            <>
              <Field label={t('user.form.legal_name')} required error={errors.legalName}>
                <Input value={form.legalName} onChange={set('legalName')} disabled={submitting} />
              </Field>
              <Field label={t('user.form.inn')}>
                <Input
                  value={form.inn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, inn: maskDigitsOnly(e.target.value).slice(0, 9) }))
                  }
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="123456789"
                  disabled={submitting}
                />
              </Field>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t('user.form.last_name')} required error={errors.lastName}>
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value.toUpperCase() }))}
                    disabled={submitting}
                  />
                </Field>
                <Field label={t('user.form.first_name')} required error={errors.firstName}>
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value.toUpperCase() }))}
                    disabled={submitting}
                  />
                </Field>
              </div>
              <Field label={t('user.form.middle_name')} required error={errors.middleName}>
                <Input
                  value={form.middleName}
                  onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value.toUpperCase() }))}
                  disabled={submitting}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* PINFL — 14 digits only */}
                <div className="flex flex-col gap-1.5">
                  <Label>{t('user.form.pinfl')}</Label>
                  <Input
                    value={form.pinfl}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, pinfl: maskDigitsOnly(e.target.value).slice(0, 14) }))
                    }
                    onBlur={() => setErrors((e) => ({ ...e, pinfl: validatePinfl(form.pinfl) }))}
                    inputMode="numeric"
                    maxLength={14}
                    placeholder="12345678901234"
                    disabled={submitting}
                  />
                  <FieldError error={errors.pinfl} />
                </div>

                {/* Passport seria — AA1234567 */}
                <div className="flex flex-col gap-1.5">
                  <Label>{t('user.form.passport')}</Label>
                  <Input
                    value={form.passportSeria}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, passportSeria: maskPassportSeria(e.target.value) }))
                    }
                    onBlur={() =>
                      setErrors((e) => ({ ...e, passportSeria: validatePassportSeria(form.passportSeria) }))
                    }
                    maxLength={9}
                    placeholder="AA1234567"
                    disabled={submitting}
                  />
                  <FieldError error={errors.passportSeria} />
                </div>
              </div>

              {/* Birth date — dd.MM.yyyy */}
              <div className="flex flex-col gap-1.5">
                <Label>{t('user.form.birth_date')}</Label>
                <DatePicker
                  value={form.birthDate}
                  onChange={(val) => {
                    setForm((f) => ({ ...f, birthDate: val }))
                    setErrors((e) => ({ ...e, birthDate: validateBirthDate(val) }))
                  }}
                  placeholder="15.03.1990"
                  disabled={submitting}
                  hasError={Boolean(errors.birthDate)}
                />
                <FieldError error={errors.birthDate} />
              </div>
            </>
          )}

          {/* Pseudonym */}
          <Field label={t('user.form.pseudonym')}>
            <Input value={form.pseudonym} onChange={set('pseudonym')} disabled={submitting} />
          </Field>

          {/* Phones */}
          <div className="flex flex-col gap-1.5">
            <Label>{t('user.form.phones')}</Label>
            <div className="flex flex-col gap-2">
              <PhoneField
                value={phone1}
                onChange={(v) => { setPhone1(v); if (phone1Err) setPhone1Err(null) }}
                onBlur={() => setPhone1Err(phone1.trim() ? validatePhone(phone1) : null)}
                error={phone1Err}
                disabled={submitting}
              />
              <PhoneField
                value={phone2}
                onChange={(v) => { setPhone2(v); if (phone2Err) setPhone2Err(null) }}
                onBlur={() => setPhone2Err(phone2.trim() ? validatePhone(phone2) : null)}
                error={phone2Err}
                disabled={submitting}
                optional
              />
            </div>
          </div>

          {/* Address — region + district dropdowns + street input */}
          <div className="flex flex-col gap-3">
            <Label>
              {t('user.form.address')}
              <span className="text-destructive"> *</span>
            </Label>

            {geoLoading ? (
              <div className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('user.form.geo_loading')}
              </div>
            ) : geoError ? (
              <p className="py-1 text-sm text-destructive">⚠️ {geoError}</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Region */}
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={regionId}
                      onValueChange={(v) => {
                        setRegionId(v)
                        setDistrictId('')
                        setErrors((e) => ({ ...e, region: null, district: null }))
                      }}
                      disabled={submitting}
                    >
                      <SelectTrigger className={cn(errors.region && 'border-destructive')}>
                        <SelectValue placeholder={t('user.form.region_ph')} />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.region && <p className="text-xs text-destructive">{errors.region}</p>}
                  </div>

                  {/* District */}
                  <div className="flex flex-col gap-1.5">
                    <Select
                      value={districtId}
                      onValueChange={(v) => {
                        setDistrictId(v)
                        setErrors((e) => ({ ...e, district: null }))
                      }}
                      disabled={!regionId || submitting}
                    >
                      <SelectTrigger className={cn(errors.district && 'border-destructive')}>
                        <SelectValue
                          placeholder={
                            regionId
                              ? t('user.form.district_ph')
                              : t('user.form.district_ph_region_first')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {districtsForRegion.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
                  </div>
                </div>

                {/* Street & House Number side-by-side */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Input
                      value={form.street}
                      onChange={set('street')}
                      placeholder={t('user.form.street_ph')}
                      disabled={submitting}
                      className={cn(errors.street && 'border-destructive')}
                    />
                    {errors.street && <p className="text-xs text-destructive">{errors.street}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Input
                      value={form.house}
                      onChange={set('house')}
                      placeholder={t('user.form.house_ph')}
                      disabled={submitting}
                      className={cn(errors.house && 'border-destructive')}
                    />
                    {errors.house && <p className="text-xs text-destructive">{errors.house}</p>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={submitting || geoLoading || !!geoError}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('user.form.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
