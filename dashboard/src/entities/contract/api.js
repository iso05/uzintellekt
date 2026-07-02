import { request, cachedGridGet, tokenStorage } from '@shared/api'

export async function getContractsGrid({
  page = 0,
  size = 10,
  sorts = [],
  filters = [],
} = {}) {
  const sort = sorts?.[0] || { selector: 'signedAt', desc: true }
  return cachedGridGet('/api/v1/contracts/grid', { page, size, filters, sort })
}

export async function downloadContract(contractId) {
  const res = await request(`/api/v1/contracts/${contractId}/download`)
  return res.json()
}

export async function fetchContractBlob(url) {
  const token = tokenStorage.get()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error('Fayl yuklab olinmadi')
  return res.blob()
}
