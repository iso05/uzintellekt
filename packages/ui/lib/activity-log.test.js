import { describe, it, expect, beforeEach } from 'vitest'
import { logActivity, getActivityLog, clearActivityLog } from './activity-log'

describe('activity log', () => {
  beforeEach(() => clearActivityLog())

  it('records an entry and returns newest first', () => {
    logActivity('user.block', 'Ali')
    logActivity('work.decide', 'w1', { decision: 'APPROVE' })

    const log = getActivityLog()
    expect(log).toHaveLength(2)
    expect(log[0].type).toBe('work.decide')
    expect(log[0].target).toBe('w1')
    expect(log[0].meta).toEqual({ decision: 'APPROVE' })
    expect(log[1].type).toBe('user.block')
    expect(typeof log[0].at).toBe('string')
  })

  it('caps the log at 100 entries', () => {
    for (let i = 0; i < 120; i++) logActivity('work.submit', `w${i}`)
    const log = getActivityLog()
    expect(log).toHaveLength(100)
    expect(log[0].target).toBe('w119') // most recent kept
    expect(log.some((e) => e.target === 'w19')).toBe(false) // oldest evicted
  })

  it('clearActivityLog empties the log', () => {
    logActivity('file.delete', 'f1')
    clearActivityLog()
    expect(getActivityLog()).toEqual([])
  })
})
