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
  toast,
} from '@shared/ui'
import { maskPhone } from '@shared/lib/input-masks'
import { validatePhone } from '@shared/lib/validators'
import {
  loadGeo,
  parseAddress,
  buildAddress,
  findRegionByName,
  findDistrictByName,
  districtsOfRegion,
} from '@shared/api'
import { updateUser, USER_ROLES } from '@/entities/user'

// A single validated phone input (masked to 998XXXXXXXXX, clearable) — mirrors
// the dashboard's phone editor so numbers are validated per-field, not entered
// as one free-text comma list.
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
          onFocus={(e) => {
            if (!e.target.value) onChange('998')
          }}
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

/**
 * Edit the admin-mutable fields of a user (AdminUpdateUserRequest): role,
 * pseudonym, phones, address. Address is entered as a cascading region/district
 * dropdown + street/house (same geo source as the dashboard), then serialised to
 * the "Region, District, Street, House" string the backend expects.
 */
export default function EditUserDialog({ user, open, onOpenChange, onUpdated }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ role: 'USER', pseudonym: '' })
  const [phone1, setPhone1] = useState('')
  const [phone2, setPhone2] = useState('')
  const [phone1Err, setPhone1Err] = useState(null)
  const [phone2Err, setPhone2Err] = useState(null)
  const [regionId, setRegionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [street, setStreet] = useState('')
  const [house, setHouse] = useState('')
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setForm({
      role: user.role || 'USER',
      pseudonym: user.pseudonym || '',
    })
    const phones = Array.isArray(user.phones) ? user.phones : []
    setPhone1(phones[0] || '')
    setPhone2(phones[1] || '')
    setPhone1Err(null)
    setPhone2Err(null)
    setErrors({})
    setSubmitting(false)

    let alive = true
    setGeoError(null)
    setGeoLoading(true)
    loadGeo()
      .then(({ regions: r, districts: d }) => {
        if (!alive) return
        setRegions(r)
        setDistricts(d)
        const parsed = parseAddress(user.address)
        const regionObj = findRegionByName(r, parsed.region)
        if (regionObj) {
          setRegionId(String(regionObj.id))
          const districtObj = findDistrictByName(d, regionObj.id, parsed.district)
          setDistrictId(districtObj ? String(districtObj.id) : '')
        } else {
          setRegionId('')
          setDistrictId('')
        }
        setStreet(parsed.street || '')
        setHouse(parsed.house || '')
      })
      .catch(() => {
        if (alive) setGeoError(t('user.form.geo_error'))
      })
      .finally(() => {
        if (alive) setGeoLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const districtsForRegion = districtsOfRegion(districts, regionId)

  const hasFullAddress = !!(regionId && districtId && street.trim() && house.trim())

  function validate() {
    const errs = {}
    // Phone 1 is required; phone 2 is validated only when filled.
    const p1Err = validatePhone(phone1)
    const p2Err = phone2.trim() ? validatePhone(phone2) : null
    setPhone1Err(p1Err)
    setPhone2Err(p2Err)
    // A full cascade lets us build a fresh address. Otherwise we keep the user's
    // existing address as-is (legacy/free-text addresses don't parse into the
    // region/district lists) — so unrelated edits (role, phone) aren't blocked.
    // Only require input when there is no address to fall back to at all.
    if (!hasFullAddress && !(user.address || '').trim()) errs.address = t('user.form.required')
    setErrors(errs)
    return !p1Err && !p2Err && Object.keys(errs).length === 0
  }

  async function onSubmit() {
    if (geoError || !validate()) return
    let address = user.address
    if (hasFullAddress) {
      const region = regions.find((r) => String(r.id) === regionId)
      const district = districts.find((d) => String(d.id) === districtId)
      if (!region || !district) return
      address = buildAddress({ regionName: region.name, districtName: district.name, street, house })
    }
    setSubmitting(true)
    try {
      const payload = {
        role: form.role,
        address,
        phones: [phone1.trim(), phone2.trim()].filter(Boolean),
        pseudonym: form.pseudonym.trim() || undefined,
      }
      const updated = await updateUser(user.id, payload)
      toast.success(t('user.updated_toast'))
      onOpenChange(false)
      onUpdated?.(updated)
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
          <DialogTitle>{t('user.edit_title')}</DialogTitle>
          <DialogDescription>{t('user.edit_desc')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          <div className="flex flex-col gap-1.5">
            <Label>{t('user.form.role')}</Label>
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USER_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`role.${r.toLowerCase()}`, { defaultValue: r })}
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
            <div className="flex flex-col gap-2">
              <PhoneField
                value={phone1}
                onChange={(v) => {
                  setPhone1(v)
                  if (phone1Err) setPhone1Err(null)
                }}
                onBlur={() => setPhone1Err(validatePhone(phone1))}
                error={phone1Err}
                disabled={submitting}
              />
              <PhoneField
                value={phone2}
                onChange={(v) => {
                  setPhone2(v)
                  if (phone2Err) setPhone2Err(null)
                }}
                onBlur={() => setPhone2Err(phone2.trim() ? validatePhone(phone2) : null)}
                error={phone2Err}
                disabled={submitting}
                optional
              />
            </div>
          </div>

          {/* Address — cascading geo dropdown (same source as dashboard) */}
          {geoLoading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('user.form.geo_loading')}
            </div>
          ) : geoError ? (
            <p className="py-2 text-sm text-destructive">⚠️ {geoError}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t('user.form.region')}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Select
                    value={regionId}
                    onValueChange={(v) => {
                      setRegionId(v)
                      setDistrictId('')
                    }}
                    disabled={submitting}
                  >
                    <SelectTrigger>
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
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t('user.form.district')}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Select value={districtId} onValueChange={setDistrictId} disabled={!regionId || submitting}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          regionId ? t('user.form.district_ph') : t('user.form.district_ph_region_first')
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
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t('user.form.street')}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder={t('user.form.street_ph')}
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>
                    {t('user.form.house')}
                    <span className="text-destructive"> *</span>
                  </Label>
                  <Input
                    value={house}
                    onChange={(e) => setHouse(e.target.value)}
                    placeholder={t('user.form.house_ph')}
                    disabled={submitting}
                  />
                </div>
              </div>
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button onClick={onSubmit} disabled={submitting || geoLoading || !!geoError}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('user.form.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
