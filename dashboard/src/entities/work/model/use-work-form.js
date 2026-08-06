import { useState, useCallback, useEffect, useRef } from 'react'
import { maskLatinName, maskPassport, maskShare, maskUzPinfl } from '@shared/lib/input-masks'
import {
  validateRequired,
  validatePassport,
  validatePinfl,
  validateLatinName,
  validateShare,
  normalizePassportName,
} from '@shared/lib/validators'
import {
  EMPTY_HOLDER,
  buildHolderErrorKey,
  computeShareTotal,
  findDuplicatePassportErrors,
} from './validation'

const INITIAL_FORM = {
  name: '',
  description: '',
  workTypeId: '',
  rightHolders: [{ ...EMPTY_HOLDER }],
}

const HOLDER_FIELD_MASKS = {
  passportNo: maskPassport,
  firstName: maskLatinName,
  lastName: maskLatinName,
  share: maskShare,
}

const FIELD_BLUR_VALIDATORS = {
  name: (v) => validateRequired(v, 'validation.field_work_name'),
  workTypeId: (v) => validateRequired(v, 'validation.field_work_type'),
}

const HOLDER_BLUR_VALIDATORS = {
  passportNo: null,
  firstName: (v) => validateLatinName(v, 'validation.field_first_name'),
  lastName: (v) => validateLatinName(v, 'validation.field_last_name'),
  share: validateShare,
  authorRoleIds: (v) => (!v || v.length === 0 ? { key: 'validation.role_required' } : null),
}

export function useWorkForm(initial = INITIAL_FORM) {
  const [form, setForm] = useState(initial)
  const [fieldErrors, setFieldErrors] = useState({})
  const [shareTotalError, setShareTotalError] = useState('')

  // Mirror of `form` for synchronous reads inside event handlers
  // (e.g. cross-holder duplicate check on blur).
  const formRef = useRef(form)
  useEffect(() => {
    formRef.current = form
  }, [form])

  const setField = useCallback((key, value) => {
    setForm((f) => ({ ...f, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const setHolder = useCallback((idx, key, raw) => {
    setForm((f) => {
      const rh = [...f.rightHolders]
      const holder = rh[idx]
      const isLegal = holder?.type === 'LEGAL'

      let value = raw
      if (key === 'passportNo') {
        if (isLegal) {
          value = raw.replace(/\D/g, '').slice(0, 9)
        } else {
          value = maskUzPinfl(raw)
        }
      } else if ((key === 'firstName' || key === 'lastName') && isLegal) {
        value = raw
      } else if (HOLDER_FIELD_MASKS[key]) {
        value = HOLDER_FIELD_MASKS[key](raw)
      }

      rh[idx] = { ...rh[idx], [key]: value }
      return { ...f, rightHolders: rh }
    })
    setShareTotalError('')
    const errKey = buildHolderErrorKey(idx, key)
    setFieldErrors((prev) => {
      if (!prev[errKey]) return prev
      const next = { ...prev }
      delete next[errKey]
      return next
    })
  }, [])

  const addHolder = useCallback(() => {
    setForm((f) => ({ ...f, rightHolders: [...f.rightHolders, { ...EMPTY_HOLDER }] }))
  }, [])

  const removeHolder = useCallback((idx) => {
    setForm((f) => {
      if (f.rightHolders.length === 1) return f
      return { ...f, rightHolders: f.rightHolders.filter((_, i) => i !== idx) }
    })
    setShareTotalError('')
  }, [])

  const handleFieldBlur = useCallback((field, value) => {
    const validator = FIELD_BLUR_VALIDATORS[field]
    if (!validator) return
    const err = validator(value)
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (err) next[field] = err
      else delete next[field]
      return next
    })
  }, [])

  const handleHolderBlur = useCallback((idx, field, value) => {
    let finalValue = value
    const holder = formRef.current.rightHolders[idx]
    const isLegal = holder?.type === 'LEGAL'

    if (field === 'firstName' || field === 'lastName') {
      if (!isLegal) {
        finalValue = normalizePassportName(value)
        setForm((f) => {
          const rh = [...f.rightHolders]
          rh[idx] = { ...rh[idx], [field]: finalValue }
          return { ...f, rightHolders: rh }
        })
      }
    }

    setFieldErrors((prev) => {
      const next = { ...prev }
      const errKey = buildHolderErrorKey(idx, field)

      if (field === 'passportNo') {
        if (isLegal) {
          if (!finalValue || finalValue.trim() === '') {
            next[errKey] = { key: 'validation.inn_required' }
          } else if (!/^\d{9}$/.test(finalValue.trim())) {
            next[errKey] = { key: 'validation.inn_format' }
          } else {
            delete next[errKey]
          }
        } else {
          const err = validatePinfl(finalValue)
          if (err) next[errKey] = err
          else delete next[errKey]
        }
      } else if (field === 'firstName') {
        if (isLegal) {
          if (!finalValue || finalValue.trim() === '') {
            next[errKey] = { key: 'validation.org_name_required' }
          } else {
            delete next[errKey]
          }
        } else {
          const err = validateLatinName(finalValue, 'validation.field_first_name')
          if (err) next[errKey] = err
          else delete next[errKey]
        }
      } else if (field === 'lastName') {
        if (isLegal) {
          delete next[errKey]
        } else {
          const err = validateLatinName(finalValue, 'validation.field_last_name')
          if (err) next[errKey] = err
          else delete next[errKey]
        }
      } else {
        const validator = HOLDER_BLUR_VALIDATORS[field]
        if (validator) {
          const err = validator(finalValue)
          if (err) next[errKey] = err
          else delete next[errKey]
        }
      }

      // Cross-holder uniqueness for passportNo: re-run on every passport blur
      // so editing one holder's passport can clear or trigger errors on others.
      if (field === 'passportNo') {
        const maskedValue = isLegal
          ? finalValue.trim()
          : (HOLDER_FIELD_MASKS.passportNo ? HOLDER_FIELD_MASKS.passportNo(value) : value)
        const holders = formRef.current.rightHolders.map((h, i) =>
          i === idx ? { ...h, passportNo: maskedValue } : h
        )
        const dup = findDuplicatePassportErrors(holders)
        holders.forEach((_, i) => {
          const k = buildHolderErrorKey(i, 'passportNo')
          if (dup[k]) next[k] = dup[k]
          else if (next[k]?.key === 'validation.passport_dup') delete next[k]
        })
      }
      return next
    })
  }, [])

  const resetErrors = useCallback(() => {
    setFieldErrors({})
    setShareTotalError('')
  }, [])

  const shareTotal = computeShareTotal(form.rightHolders)

  const getRemainingShareFor = useCallback(
    (idx) => {
      const sumOther = form.rightHolders.reduce((sum, item, i) => {
        if (i === idx) return sum
        return sum + (Number(item.share) || 0)
      }, 0)
      return Math.max(0, 100 - sumOther)
    },
    [form.rightHolders]
  )

  return {
    form,
    setForm,
    fieldErrors,
    setFieldErrors,
    shareTotalError,
    setShareTotalError,
    shareTotal,
    setField,
    setHolder,
    addHolder,
    removeHolder,
    handleFieldBlur,
    handleHolderBlur,
    resetErrors,
    getRemainingShareFor,
  }
}
