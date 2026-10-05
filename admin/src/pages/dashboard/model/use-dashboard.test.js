import { describe, expect, it } from 'vitest'
import { processWorksData } from './use-dashboard'

describe('processWorksData', () => {
  it('groups the OpenAPI `status` field for the work-status chart', () => {
    expect(processWorksData({
      rows: [
        { workTypeId: 1, status: 'REGISTERED', count: 4 },
        { workTypeId: 2, status: 'UNDER_REVIEW', count: 3 },
        { workTypeId: 1, status: 'REGISTERED', count: 2 },
      ],
    })).toMatchObject({
      total: 9,
      byStatus: { REGISTERED: 6, UNDER_REVIEW: 3 },
      byType: [
        { workTypeId: 1, total: 6 },
        { workTypeId: 2, total: 3 },
      ],
    })
  })
})
