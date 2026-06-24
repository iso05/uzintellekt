#!/usr/bin/env node
// Refresh bundled UZ regions/districts from upstream.
//   Usage: node scripts/update-geo.mjs   (or: npm run update:geo)
// Validates shape before writing so a broken upstream can't corrupt the bundle.

import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SOURCES = {
  regions:
    'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Regions.json',
  districts:
    'https://raw.githubusercontent.com/Nodirbek-Abdulaxadov/Uz_Regions/master/Uz_Regions/StaticData/Districts.json',
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'src', 'shared', 'data', 'geo')

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json()
}

function isRegion(x) {
  return x && typeof x.id === 'number' && typeof x.name === 'string'
}

function isDistrict(x) {
  return (
    x &&
    typeof x.id === 'number' &&
    typeof x.region_id === 'number' &&
    typeof x.name === 'string'
  )
}

function validate(name, arr, check, min) {
  if (!Array.isArray(arr)) throw new Error(`${name}: not an array`)
  if (arr.length < min) throw new Error(`${name}: only ${arr.length} items (min ${min})`)
  for (const item of arr) {
    if (!check(item)) throw new Error(`${name}: bad shape — ${JSON.stringify(item)}`)
  }
}

async function main() {
  console.log('Fetching upstream geo data...')
  const [regions, districts] = await Promise.all([
    fetchJson(SOURCES.regions),
    fetchJson(SOURCES.districts),
  ])

  validate('regions', regions, isRegion, 10)
  validate('districts', districts, isDistrict, 100)

  const regionIds = new Set(regions.map((r) => r.id))
  const orphans = districts.filter((d) => !regionIds.has(d.region_id))
  if (orphans.length) {
    console.warn(`Warning: ${orphans.length} districts reference unknown region_id`)
  }

  await writeFile(join(OUT_DIR, 'regions.json'), JSON.stringify(regions, null, 2) + '\n')
  await writeFile(join(OUT_DIR, 'districts.json'), JSON.stringify(districts, null, 2) + '\n')

  console.log(`Updated: ${regions.length} regions, ${districts.length} districts`)
}

main().catch((e) => {
  console.error('update-geo failed:', e.message)
  process.exit(1)
})
