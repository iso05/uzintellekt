import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@/shared/ui'
import {
  loadGeo,
  parseAddress,
  buildAddress,
  findRegionByName,
  findDistrictByName,
  districtsOfRegion,
} from '@/shared/api'
import { updateMeField } from '@/entities/user'

export default function AddressEditDialog({ open, onOpenChange, initialAddress, onDone }) {
  const [regions, setRegions] = useState([])
  const [districts, setDistricts] = useState([])
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState(null)

  const [regionId, setRegionId] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [street, setStreet] = useState('')
  const [house, setHouse] = useState('')
  const [saving, setSaving] = useState(false)

  // Reset + load when dialog opens
  useEffect(() => {
    if (!open) return
    let alive = true
    setGeoError(null)
    setGeoLoading(true)
    loadGeo()
      .then(({ regions: r, districts: d }) => {
        if (!alive) return
        setRegions(r)
        setDistricts(d)

        const parsed = parseAddress(initialAddress)
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
        if (alive) setGeoError("Viloyat/tuman ma'lumotlarini yuklab bo'lmadi.")
      })
      .finally(() => {
        if (alive) setGeoLoading(false)
      })
    return () => {
      alive = false
    }
  }, [open, initialAddress])

  const districtsForRegion = districtsOfRegion(districts, regionId)

  const canSave =
    !!regionId && !!districtId && street.trim().length > 0 && house.trim().length > 0 && !saving

  const handleSave = async () => {
    if (!canSave) return
    const region = regions.find((r) => String(r.id) === regionId)
    const district = districts.find((d) => String(d.id) === districtId)
    if (!region || !district) {
      toast.error('Viloyat yoki tuman tanlanmagan')
      return
    }
    setSaving(true)
    try {
      const address = buildAddress({
        regionName: region.name,
        districtName: district.name,
        street,
        house,
      })
      const updated = await updateMeField('address', address)
      toast.success('Manzil saqlandi')
      onDone?.(updated)
      onOpenChange(false)
    } catch (e) {
      toast.error(e?.message || 'Saqlashda xatolik')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manzilni tahrirlash</DialogTitle>
        </DialogHeader>

        {geoLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Hududlar ro'yxati yuklanmoqda...</p>
          </div>
        ) : geoError ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center text-sm text-destructive">
            <span>⚠️ {geoError}</span>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Yopish
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>
                Viloyat <span className="text-destructive">*</span>
              </Label>
              <Select
                value={regionId}
                onValueChange={(v) => {
                  setRegionId(v)
                  setDistrictId('')
                }}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Viloyatni tanlang" />
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
                Tuman/Shahar <span className="text-destructive">*</span>
              </Label>
              <Select
                value={districtId}
                onValueChange={setDistrictId}
                disabled={!regionId || saving}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={regionId ? 'Tumanni tanlang' : 'Avval viloyat tanlang'}
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

            <div className="flex flex-col gap-1.5">
              <Label>
                Ko'cha nomi <span className="text-destructive">*</span>
              </Label>
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Masalan: Mustaqillik ko'chasi"
                disabled={saving}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>
                Uy raqami <span className="text-destructive">*</span>
              </Label>
              <Input
                value={house}
                onChange={(e) => setHouse(e.target.value)}
                placeholder="Masalan: 45-uy"
                disabled={saving}
              />
            </div>
          </div>
        )}

        {!geoLoading && !geoError && (
          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {saving && <Loader2 className="animate-spin" />}
              Saqlash
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
