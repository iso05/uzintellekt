import { describe, it, expect } from 'vitest'
import newsData from '@/data/newsData'

describe('news data consistency', () => {
  it('has unique ids', () => {
    const ids = newsData.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no two entries that are the same event (title + date + category)', () => {
    const seen = new Set()
    const duplicates = []
    for (const n of newsData) {
      const key = `${n.title}|${n.date}|${n.category}`
      if (seen.has(key)) duplicates.push(key)
      seen.add(key)
    }
    expect(duplicates).toEqual([])
  })
})
