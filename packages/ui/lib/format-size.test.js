import { describe, it, expect } from 'vitest'
import { formatBytes, formatNumber } from './format'

describe('formatBytes', () => {
  it('renders binary units', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
    expect(formatBytes(5 * 1024 * 1024 * 1024)).toBe('5 GB')
  })

  it('guards against invalid input', () => {
    expect(formatBytes(-10)).toBe('0 B')
    expect(formatBytes(NaN)).toBe('0 B')
    expect(formatBytes(null)).toBe('0 B')
  })
})

describe('formatNumber', () => {
  it('groups thousands with a non-breaking space', () => {
    const NB = ' '
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(1000)).toBe(`1${NB}000`)
    expect(formatNumber(1234567)).toBe(`1${NB}234${NB}567`)
  })

  it('is 0 for invalid input', () => {
    expect(formatNumber(NaN)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
  })
})
