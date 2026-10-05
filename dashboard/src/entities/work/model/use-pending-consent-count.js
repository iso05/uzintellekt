import { useEffect, useState, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@shared/ui'
import { getMyContributions } from '../api'

const SEEN_KEY = 'uz_seen_pending_consent_ids'

export function getSeenConsentIds() {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

export function markConsentIdsAsSeen(ids) {
  try {
    const current = getSeenConsentIds()
    let changed = false
    ids.forEach((id) => {
      const lower = String(id).toLowerCase()
      if (!current.has(lower)) {
        current.add(lower)
        changed = true
      }
    })
    if (changed) {
      localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(current)))
      window.dispatchEvent(new Event('seen_pending_consent_updated'))
    }
  } catch (err) {
    console.error('Error saving seen consent ids:', err)
  }
}

export function usePendingConsentCount({ ownWorkIds = new Set(), userId = null, enabled = true } = {}) {
  const { t } = useTranslation()
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingIds, setPendingIds] = useState([])
  const prevCountRef = useRef(null)

  const checkPending = useCallback(async () => {
    try {
      const data = await getMyContributions()
      const list = data ?? []
      const ownIds = ownWorkIds instanceof Set ? ownWorkIds : new Set(ownWorkIds || [])

      // Filter to works created by someone else and awaiting caller's consent
      const pendingItems = list.filter((item) => {
        const id = String(item.id || item.workId || '').toLowerCase()
        if (ownIds.has(id)) return false
        if (userId && item.createdBy && String(item.createdBy) === String(userId)) return false

        const st = String(item.state || item.status || item.workState || '').toUpperCase()
        if (st === 'DRAFT' || st === 'DRAFT_LIMIT_REACHED') return false

        // Check if consent is pending / awaiting
        return (
          item.awaitingMyConsent === true ||
          item.consentState === 'PENDING' ||
          (item.state === 'PENDING_CONSENT' && item.consentState !== 'ACCEPTED' && item.consentState !== 'DECLINED')
        )
      })

      const ids = pendingItems.map((item) => String(item.id || item.workId).toLowerCase())
      setPendingIds(ids)

      const seen = getSeenConsentIds()
      const unseenItems = ids.filter((id) => !seen.has(id))
      const count = unseenItems.length
      setPendingCount(count)

      // If count increased while app is open, fire toast notification!
      if (prevCountRef.current !== null && count > prevCountRef.current) {
        const newCount = count - prevCountRef.current
        toast.info(t('contrib.new_consent_toast', { count: newCount }), {
          duration: 6000,
        })
      }
      prevCountRef.current = count
    } catch (err) {
      console.warn('⚡ Initial consent check silent failure:', err)
    }
  }, [ownWorkIds, userId, t])

  useEffect(() => {
    if (!enabled) return
    checkPending()

    const handleSeenUpdate = () => checkPending()
    window.addEventListener('seen_pending_consent_updated', handleSeenUpdate)
    return () => window.removeEventListener('seen_pending_consent_updated', handleSeenUpdate)
  }, [enabled, checkPending])

  return { pendingCount, pendingIds, refreshPendingCount: checkPending }
}
