import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@shared/api', () => ({
  requestJson: vi.fn(),
  cachedGridGet: vi.fn(),
  invalidateCache: vi.fn(),
}))

import { requestJson, cachedGridGet, invalidateCache } from '@shared/api'
import { getWorkById, decideWork, getRightHolderDocuments, getAdminRightHolderDocumentDownloadUrl } from './api'

const WORKS_GRID = '/api/v1/works/grid'

describe('work api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getWorkById fetches a single work through the grid by id', async () => {
    cachedGridGet.mockResolvedValue({ items: [{ id: 'w1', name: 'A' }] })

    const work = await getWorkById('w1')

    expect(work).toEqual({ id: 'w1', name: 'A' })
    expect(cachedGridGet).toHaveBeenCalledWith(WORKS_GRID, {
      page: 1,
      size: 1,
      filters: [{ field: 'id', operator: 'eq', value: 'w1' }],
    })
  })

  it('getWorkById returns null when the work is not found', async () => {
    cachedGridGet.mockResolvedValue({ items: [] })
    expect(await getWorkById('missing')).toBeNull()
  })

  it('decideWork PATCHes the admin decide endpoint and invalidates the grid', async () => {
    requestJson.mockResolvedValue({ ok: true })

    await decideWork('w1', { decision: 'REJECT', reason: 'no scan' })

    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/works/w1/decide', {
      method: 'PATCH',
      body: JSON.stringify({ decision: 'REJECT', reason: 'no scan' }),
    })
    expect(invalidateCache).toHaveBeenCalledWith(WORKS_GRID)
  })

  it('uses the admin endpoints for right-holder documents and their downloads', async () => {
    requestJson.mockResolvedValue({ downloadUrl: 'https://storage.example/document' })

    await getRightHolderDocuments('w1', 'h1')
    await getAdminRightHolderDocumentDownloadUrl('w1', 'h1', 'd1')

    expect(requestJson).toHaveBeenNthCalledWith(1, '/api/v1/admin/works/w1/right-holders/h1/documents')
    expect(requestJson).toHaveBeenNthCalledWith(2, '/api/v1/admin/works/w1/right-holders/h1/documents/d1/download-url')
  })
})
