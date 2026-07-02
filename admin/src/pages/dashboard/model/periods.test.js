import { describe, it, expect } from 'vitest'
import {
  makePreset,
  makeCustom,
  previousRange,
  granularityForRange,
  spanDays,
  deltaPct,
  DEFAULT_PERIOD_KEY,
} from './periods'

describe('period presets', () => {
  it('makePreset puts `to` after `from` by the preset day count', () => {
    const { from, to } = makePreset('7d')
    expect(spanDays(from, to)).toBe(7)
  })

  it('derives granularity from the span, not the preset', () => {
    const g = (p) => granularityForRange(p.from, p.to)
    expect(g(makePreset('7d'))).toBe('DAY')
    expect(g(makePreset('30d'))).toBe('DAY')
    expect(g(makePreset('90d'))).toBe('WEEK')
    // A long custom range rolls up to months.
    expect(granularityForRange(new Date('2026-01-01'), new Date('2026-12-31'))).toBe('MONTH')
  })

  it('falls back to the default preset for an unknown key', () => {
    expect(makePreset('bogus').key).toBe(DEFAULT_PERIOD_KEY)
  })

  it('makeCustom normalises reversed dates and tags the key', () => {
    const a = new Date('2026-03-10')
    const b = new Date('2026-03-01')
    const p = makeCustom(a, b)
    expect(p.key).toBe('custom')
    expect(p.from).toEqual(b)
    expect(p.to).toEqual(a)
  })

  it('previousRange is the equally-sized window right before the current one', () => {
    const cur = makePreset('7d')
    const prev = previousRange(cur)
    expect(spanDays(prev.from, prev.to)).toBe(7)
    expect(prev.to.getTime()).toBe(cur.from.getTime())
  })
})

describe('deltaPct', () => {
  it('computes percent change of current vs previous', () => {
    expect(deltaPct(120, 100)).toBe(20)
    expect(deltaPct(80, 100)).toBe(-20)
    expect(deltaPct(100, 100)).toBe(0)
  })

  it('handles a zero previous value', () => {
    expect(deltaPct(5, 0)).toBe(100)
    expect(deltaPct(0, 0)).toBe(0)
  })
})
