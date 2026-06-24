export const validatePassport = (value) => {
  if (!value || value.trim() === '')
    return 'Pasport seriya/raqami kiritilishi shart'
  if (!/^[A-Z]{2}\d{7}$/.test(value))
    return "Pasport noto'g'ri formatda (AA1234567)"
  return null
}

export const validateName = (value, fieldLabel = 'Maydon') => {
  if (!value || value.trim() === '')
    return `${fieldLabel} kiritilishi shart`
  if (value.trim().length < 1)
    return `${fieldLabel} kiritilishi shart`
  return null
}

export const validatePhone = (value) => {
  if (!value || value === '') return 'Telefon raqam kiritilishi shart'
  if (!value.startsWith('998')) return 'Telefon raqam 998 bilan boshlanishi kerak'
  if (value.length < 12) return "Telefon raqam to'liq kiritilmagan (998XXXXXXXXX)"
  if (!/^998\d{9}$/.test(value)) return "Telefon raqam noto'g'ri (998XXXXXXXXX formatida)"
  return null
}

export const validateShare = (value) => {
  if (value === '' || value === null || value === undefined)
    return 'Ulush foizi kiritilishi shart'
  const num = parseFloat(value)
  if (isNaN(num)) return "Ulush foizi raqam bo'lishi kerak"
  if (num < 0.01) return "Ulush foizi kamida 0.01% bo'lishi kerak"
  if (num > 100) return "Ulush foizi 100% dan oshmasligi kerak"
  return null
}

export const validateRequired = (value, label = 'Maydon') => {
  if (!value || String(value).trim() === '')
    return `${label} kiritilishi shart`
  return null
}

export const validateShareTotal = (holders) => {
  const total = holders.reduce(
    (sum, h) => sum + (parseFloat(h.sharePercentage || h.share) || 0),
    0
  )
  const rounded = Math.round(total * 100) / 100
  if (rounded !== 100)
    return `Jami ulush 100% bo'lishi shart. Hozirgi: ${rounded}%`
  return null
}
