import { useState, useCallback, useEffect, useRef } from 'react'
import { maskName, maskPassport, maskShare } from '@/shared/lib/input-masks'
import {
  validateRequired,
  validatePassport,
  validateName,
  validateShare,
} from '@/shared/lib/validators'
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
  firstName: maskName,
  lastName: maskName,
  share: maskShare,
}

const FIELD_BLUR_VALIDATORS = {
  name: (v) => validateRequired(v, 'validation.field_work_name'),
  workTypeId: (v) => validateRequired(v, 'validation.field_work_type'),
}

const HOLDER_BLUR_VALIDATORS = {
  passportNo: validatePassport,
  firstName: (v) => validateName(v, 'validation.field_first_name'),
  lastName: (v) => validateName(v, 'validation.field_last_name'),
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
    const value = HOLDER_FIELD_MASKS[key] ? HOLDER_FIELD_MASKS[key](raw) : raw
    setForm((f) => {
      const rh = [...f.rightHolders]
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
    const validator = HOLDER_BLUR_VALIDATORS[field]
    setFieldErrors((prev) => {
      const next = { ...prev }
      if (validator) {
        const err = validator(value)
        const errKey = buildHolderErrorKey(idx, field)
        if (err) next[errKey] = err
        else delete next[errKey]
      }
      // Cross-holder uniqueness for passportNo: re-run on every passport blur
      // so editing one holder's passport can clear or trigger errors on others.
      // Build a fresh snapshot from formRef + the value just blurred — onChange
      // and onBlur fire in the same batch, so formRef may still be stale.
      if (field === 'passportNo') {
        const maskedValue = HOLDER_FIELD_MASKS.passportNo
          ? HOLDER_FIELD_MASKS.passportNo(value)
          : value
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
