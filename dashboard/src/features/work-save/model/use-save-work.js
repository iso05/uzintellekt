import { useState, useCallback } from 'react'
import i18n from '@/i18n'
import { toast } from '@/shared/ui'
import {
  createWork,
  updateWork,
  submitWork,
  toPayload,
  validateWorkForm,
  getShareTotalError,
} from '@/entities/work'

function _scrollToFirstError(errors, totalError) {
  const firstKey = Object.keys(errors)[0]
  let targetId = ''
  if (firstKey) {
    if (firstKey.includes('rightHolders')) {
      const match = firstKey.match(/rightHolders\[(\d+)\]\.(.+)/)
      if (match) targetId = `holder-field-${match[1]}-${match[2]}`
    } else {
      targetId = `form-field-${firstKey}`
    }
  } else if (totalError) {
    targetId = 'right-holders-total'
  }
  if (targetId) {
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function _mapBackendErrors(apiError) {
  if (!apiError || !Array.isArray(apiError.errors)) return null
  const map = {}
  apiError.errors.forEach((e) => {
    if (e.fieldName) {
      map[e.fieldName] = e.message || e.defaultMessage || { key: 'common.error' }
    }
  })
  return Object.keys(map).length ? map : null
}

/**
 * Encapsulates the create/update + optional submit workflow.
 * Both Save and "Save & Submit" share validation, payload-build, error mapping.
 *
 * Returns: { saving, save, saveAndSubmit }
 *   `save({ form })` → creates or updates, returns saved entity
 *   `saveAndSubmit({ form })` → update then POST submit (edit only)
 */
export function useSaveWork({
  workId,
  isEdit,
  setFieldErrors,
  setShareTotalError,
}) {
  const [saving, setSaving] = useState(false)

  const _doSave = useCallback(
    async (form) => {
      const payload = toPayload(form)
      if (isEdit) return updateWork(workId, payload)
      return createWork(payload)
    },
    [workId, isEdit]
  )

  const _runValidation = useCallback(
    (form) => {
      const errors = validateWorkForm(form)
      const totalError = getShareTotalError(form.rightHolders)
      setFieldErrors(errors)
      setShareTotalError(totalError || '')
      if (Object.keys(errors).length > 0 || totalError) {
        _scrollToFirstError(errors, totalError)
        return false
      }
      return true
    },
    [setFieldErrors, setShareTotalError]
  )

  const _handleError = useCallback(
    (e) => {
      const mapped = _mapBackendErrors(e?.apiError)
      if (mapped) {
        setFieldErrors(mapped)
        _scrollToFirstError(mapped, null)
        return
      }
      toast.error(e?.message || i18n.t('common.save_error'))
    },
    [setFieldErrors]
  )

  const save = useCallback(
    async ({ form }) => {
      if (!_runValidation(form)) return null
      setSaving(true)
      try {
        const saved = await _doSave(form)
        toast.success(isEdit ? i18n.t('form.saved') : i18n.t('form.created'))
        return saved
      } catch (e) {
        _handleError(e)
        return null
      } finally {
        setSaving(false)
      }
    },
    [_runValidation, _doSave, _handleError, isEdit]
  )

  const saveAndSubmit = useCallback(
    async ({ form }) => {
      if (!_runValidation(form)) return null
      setSaving(true)
      try {
        await _doSave(form)
        await submitWork(workId)
        toast.success(i18n.t('form.submitted'))
        return true
      } catch (e) {
        _handleError(e)
        return null
      } finally {
        setSaving(false)
      }
    },
    [_runValidation, _doSave, _handleError, workId]
  )

  return { saving, save, saveAndSubmit }
}
