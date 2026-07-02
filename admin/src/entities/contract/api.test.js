import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@shared/api', () => ({
  request: vi.fn(),
  requestJson: vi.fn(),
  cachedGridGet: vi.fn(),
  invalidateCache: vi.fn(),
}))

import { request, requestJson, cachedGridGet, invalidateCache } from '@shared/api'
import { getContractsGrid, getContractDownloadUrl, uploadLegacyContract, signContract } from './api'

const CONTRACTS_GRID = '/api/v1/contracts/grid'

describe('contract api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getContractsGrid passes paging/filters', () => {
    cachedGridGet.mockResolvedValue({ items: [] })
    getContractsGrid({ page: 1, size: 10, filters: [{ field: 'type', operator: 'eq', value: 'MEMBERSHIP' }] })
    expect(cachedGridGet).toHaveBeenCalledWith(CONTRACTS_GRID, {
      page: 1,
      size: 10,
      filters: [{ field: 'type', operator: 'eq', value: 'MEMBERSHIP' }],
      sort: { selector: 'signedAt', desc: true },
    })
  })

  it('getContractDownloadUrl hits the download endpoint', () => {
    requestJson.mockResolvedValue({ url: 'https://x/y.pdf' })
    getContractDownloadUrl('c1')
    expect(requestJson).toHaveBeenCalledWith('/api/v1/contracts/c1/download')
  })

  it('uploadLegacyContract posts multipart (request + document) and invalidates', async () => {
    requestJson.mockResolvedValue({ id: 'c1' })
    const doc = new File(['pdf'], 'contract.pdf', { type: 'application/pdf' })

    await uploadLegacyContract('u1', {
      type: 'MEMBERSHIP',
      effectiveFrom: '01.01.2026',
      effectiveUntil: '01.01.2027',
      signedAt: '01.01.2026',
      document: doc,
    })

    const [path, opts] = requestJson.mock.calls[0]
    expect(path).toBe('/api/v1/admin/users/u1/contracts/legacy')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(opts.body.has('request')).toBe(true)
    expect(opts.body.get('document')).toBe(doc)
    expect(invalidateCache).toHaveBeenCalledWith(CONTRACTS_GRID)
  })

  it('signContract posts multipart (request + signatureImage) and invalidates', async () => {
    request.mockResolvedValue({})
    const sig = new File(['png'], 'sign.png', { type: 'image/png' })

    await signContract('u1', {
      contractType: 'MEMBERSHIP',
      address: 'Tashkent',
      phones: ['998900000000'],
      signatureImage: sig,
    })

    const [path, opts] = request.mock.calls[0]
    expect(path).toBe('/api/v1/admin/users/u1/contracts/sign')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(opts.body.has('request')).toBe(true)
    expect(opts.body.get('signatureImage')).toBe(sig)
    expect(invalidateCache).toHaveBeenCalledWith(CONTRACTS_GRID)
  })
})
