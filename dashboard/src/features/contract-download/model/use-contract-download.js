import { useState, useCallback } from 'react'
import i18n from '@/i18n'
import { downloadContract } from '@/entities/contract'
import { toast } from '@/shared/ui'

/**
 * Shared logic for viewing/downloading a contract PDF.
 * Returns { busyId, previewUrl, openPreview, triggerDownload, closePreview }
 *
 * busyId: contract.id while a request is in flight (null otherwise)
 */
export function useContractDownload() {
  const [busyId, setBusyId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const _resolveUrl = useCallback(async (contractId) => {
    const res = await downloadContract(contractId)
    const url = res?.url || res?.downloadUrl
    if (!url) throw new Error(i18n.t('contracts.file_not_found'))
    return url
  }, [])

  const openPreview = useCallback(async (contract) => {
    setBusyId(contract.id)
    try {
      const url = await _resolveUrl(contract.id)
      setPreviewUrl(url)
    } catch (e) {
      toast.error(e.message || i18n.t('contracts.download_error'))
    } finally {
      setBusyId(null)
    }
  }, [_resolveUrl])

  const triggerDownload = useCallback(async (contract) => {
    setBusyId(contract.id)
    try {
      const url = await _resolveUrl(contract.id)
      const a = document.createElement('a')
      a.href = url
      a.download = `shartnoma_${contract.id}.pdf`
      a.target = '_blank'
      a.rel = 'noreferrer'
      a.click()
    } catch (e) {
      toast.error(e.message || i18n.t('contracts.download_error'))
    } finally {
      setBusyId(null)
    }
  }, [_resolveUrl])

  return {
    busyId,
    previewUrl,
    openPreview,
    triggerDownload,
    closePreview: () => setPreviewUrl(null),
  }
}
