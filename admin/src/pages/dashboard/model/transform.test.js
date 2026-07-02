import { describe, it, expect } from 'vitest'
import { toChartSeries, distributionData, sumValues } from './transform'

describe('toChartSeries', () => {
  it('maps points to rows with numeric values and labels', () => {
    const series = {
      granularity: 'DAY',
      points: [
        { bucket: '01.07.2026', value: 5 },
        { bucket: '02.07.2026', value: 8 },
      ],
    }
    expect(toChartSeries(series)).toEqual([
      { bucket: '01.07.2026', label: '01.07.2026', value: 5 },
      { bucket: '02.07.2026', label: '02.07.2026', value: 8 },
    ])
  })

  it('coerces missing/NaN values to 0', () => {
    const out = toChartSeries({ points: [{ bucket: '2026-07', value: null }] })
    expect(out[0].value).toBe(0)
    expect(out[0].bucket).toBe('2026-07')
  })

  it('returns an empty array when points are absent', () => {
    expect(toChartSeries(null)).toEqual([])
    expect(toChartSeries({})).toEqual([])
  })
})

describe('distributionData', () => {
  it('maps a counts object to labeled rows in a fixed order', () => {
    const counts = { REGISTERED: 939, DRAFT: 210, UNDER_REVIEW: 47, REJECTED: 88 }
    const labels = { DRAFT: 'Черновик', UNDER_REVIEW: 'На рассмотрении', REJECTED: 'Отклонено', REGISTERED: 'Зарегистрировано' }
    const order = ['DRAFT', 'UNDER_REVIEW', 'REJECTED', 'REGISTERED']

    const out = distributionData(counts, { labels, order })

    expect(out.map((r) => r.key)).toEqual(['DRAFT', 'UNDER_REVIEW', 'REJECTED', 'REGISTERED'])
    expect(out[0]).toEqual({ key: 'DRAFT', name: 'Черновик', value: 210 })
    expect(out[3].value).toBe(939)
  })

  it('falls back to the raw key when no label is provided', () => {
    const out = distributionData({ ACTIVE: 3 })
    expect(out).toEqual([{ key: 'ACTIVE', name: 'ACTIVE', value: 3 }])
  })

  it('returns an empty array for a non-object input', () => {
    expect(distributionData(null)).toEqual([])
    expect(distributionData(undefined)).toEqual([])
  })
})

describe('sumValues', () => {
  it('adds up all counts', () => {
    expect(sumValues({ a: 2, b: 3, c: 5 })).toBe(10)
  })

  it('is 0 for empty or invalid input', () => {
    expect(sumValues({})).toBe(0)
    expect(sumValues(null)).toBe(0)
  })
})
