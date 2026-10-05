import { request, requestJson, cachedGridGet, invalidateCache } from '@shared/api'
import { toIsoDate } from '@shared/lib/format'

const CONTRACTS_GRID = '/api/v1/contracts/grid'

export function getContractsGrid({
  page = 1,
  size = 10,
  filters = [],
  sort = { selector: 'signedAt', desc: true },
} = {}) {
  return cachedGridGet(CONTRACTS_GRID, { page, size, filters, sort })
}

// Returns { url } — a presigned link to the contract PDF.
export function getContractDownloadUrl(contractId) {
  return requestJson(`/api/v1/contracts/${contractId}/download`)
}

// Upload a pre-existing (legacy) contract document on behalf of a user.
// multipart: JSON `request` part + binary `document`.
export async function uploadLegacyContract(userId, { type, effectiveFrom, effectiveUntil, signedAt, document }) {
  const fd = new FormData()
  const payload = {
    type,
    effectiveFrom: toIsoDate(effectiveFrom),
    effectiveUntil: effectiveUntil ? toIsoDate(effectiveUntil) : undefined,
    signedAt: toIsoDate(signedAt),
  }
  fd.append(
    'request',
    new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    })
  )
  fd.append('document', document)
  const data = await requestJson(`/api/v1/admin/users/${userId}/contracts/legacy`, {
    method: 'POST',
    body: fd,
  })
  invalidateCache(CONTRACTS_GRID)
  return data
}

// Sign a contract on behalf of a user.
// multipart: JSON `request` part + binary `signatureImage`.
export async function signContract(userId, { pseudonym, address, phones, contractType, signatureImage }) {
  const fd = new FormData()
  fd.append(
    'request',
    new Blob([JSON.stringify({ pseudonym, address, phones, contractType })], {
      type: 'application/json',
    })
  )
  fd.append('signatureImage', signatureImage)
  await request(`/api/v1/admin/users/${userId}/contracts/sign`, { method: 'POST', body: fd })
  invalidateCache(CONTRACTS_GRID)
}
