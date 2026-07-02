import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@shared/api', () => ({
  requestJson: vi.fn(),
  cachedGridGet: vi.fn(),
  invalidateCache: vi.fn(),
  request: vi.fn(),
}))

import { requestJson, cachedGridGet, invalidateCache } from '@shared/api'
import { getAdminFilesGrid, deleteWorkFile } from './api'

const FILES_GRID = '/api/v1/admin/work-files/grid'

describe('admin work-files api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAdminFilesGrid passes paging to the files grid', () => {
    cachedGridGet.mockResolvedValue({ items: [] })
    getAdminFilesGrid({ page: 2, size: 10 })
    expect(cachedGridGet).toHaveBeenCalledWith(FILES_GRID, {
      page: 2,
      size: 10,
      filters: [],
      sort: { selector: 'createdAt', desc: true },
    })
  })

  it('deleteWorkFile DELETEs the per-work file endpoint and invalidates the grid', async () => {
    requestJson.mockResolvedValue(null)

    await deleteWorkFile('work1', 'file1')

    expect(requestJson).toHaveBeenCalledWith('/api/v1/admin/works/work1/files/file1', {
      method: 'DELETE',
    })
    expect(invalidateCache).toHaveBeenCalledWith(FILES_GRID)
  })
})
