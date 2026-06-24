import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Localised date formatting — single source of truth so no mixed-locale dates.
// Explicit month names (Intl's `uz` short-month data is unreliable across
// browsers/ICU builds and renders as "M06"); deterministic everywhere.
const MONTHS = {
  'uz-cyrl': ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  uz: ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'],
  ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}

// Accepts an ISO string (or anything Date can parse); returns "04 iyn 2026" style.
export function formatDate(value, locale = 'uz') {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const key = (locale || 'uz').toLowerCase()
  const lang = key.startsWith('uz-cyrl') ? 'uz-cyrl' : key.slice(0, 2)
  const months = MONTHS[lang] || MONTHS.uz
  const day = String(d.getDate()).padStart(2, '0')
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`
}
