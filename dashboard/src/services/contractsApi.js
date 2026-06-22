// src/services/contractsApi.js
import { request, tokenStorage } from './api'
import { cachedGridGet } from '../utils/cachedGridRequest'

/**
 * GET /api/v1/contracts/grid — Foydalanuvchining shartnomalar ro'yxati
 * Backend foydalanuvchining tokeniga qarab faqat unga tegishlilarini qaytaradi
 */
export async function getContractsGrid({ page = 0, size = 10, sorts = [], filters = [] } = {}) {
  const sort = sorts?.[0] || { selector: 'signedAt', desc: true }
  return cachedGridGet('/api/v1/contracts/grid', { page, size, filters, sort })
}

/**
 * GET /api/v1/contracts/{contractId}/download
 * Returns: { url: string } — imzolangan PDF ning yuklab olish URLi
 */
export async function downloadContract(contractId) {
  const res = await request(`/api/v1/contracts/${contractId}/download`)
  return res.json() // { url: "..." }
}

/**
 * GET — URL bo'yicha to'g'ridan-to'g'ri PDF blobini yuklab olish
 * (downloadContract() dan olingan url uchun)
 */
export async function fetchContractBlob(url) {
  const token = tokenStorage.get()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error('Fayl yuklab olinmadi')
  return res.blob()
}
