// Uzbekistan regions/districts — bundled as static JSON to remove the external
// dependency on the upstream GitHub repo. Refresh with `npm run update:geo`.
import regions from '@shared/data/geo/regions.json'
import districts from '@shared/data/geo/districts.json'

export async function loadGeo() {
  return { regions, districts }
}

export function parseAddress(addressStr) {
  if (!addressStr) return { region: '', district: '', street: '', house: '' }
  const parts = addressStr.split(',').map((p) => p.trim())
  if (parts.length >= 4) {
    return { region: parts[0], district: parts[1], street: parts[2], house: parts[3] }
  }
  return { region: '', district: '', street: addressStr, house: '' }
}

export function buildAddress({ regionName, districtName, street, house }) {
  return `${regionName}, ${districtName}, ${street.trim()}, ${house.trim()}`
}

export function findRegionByName(regions, name) {
  if (!name) return null
  const targetRaw = name.toLowerCase().trim()
  // 1. Try exact match
  const exact = regions.find((r) => (r.name || r.name_uz || '').toLowerCase().trim() === targetRaw)
  if (exact) return exact

  // 2. Try clean match (removing viloyati, respublikasi, shahri)
  const clean = (s) => (s || '').toLowerCase().replace(/\b(viloyati|respublikasi|shahri|shaxri)\b/g, '').trim()
  const targetClean = clean(name)
  return regions.find((r) => clean(r.name || r.name_uz) === targetClean) || null
}

export function findDistrictByName(districts, regionId, name) {
  if (!name) return null
  const targetRaw = name.toLowerCase().trim()
  const inRegion = districts.filter((d) => String(d.region_id) === String(regionId))
  
  // 1. Try exact match first
  const exact = inRegion.find((d) => (d.name || d.name_uz || '').toLowerCase().trim() === targetRaw)
  if (exact) return exact

  // 2. Try clean match (removing suffixes like tumani/shahri)
  const clean = (s) => (s || '').toLowerCase().replace(/\b(tumani|shahri|shaxar|shahar)\b/g, '').trim()
  const targetClean = clean(name)
  return inRegion.find((d) => clean(d.name || d.name_uz) === targetClean) || null
}

export function districtsOfRegion(districts, regionId) {
  if (!regionId) return []
  return districts.filter((d) => String(d.region_id) === String(regionId))
}
