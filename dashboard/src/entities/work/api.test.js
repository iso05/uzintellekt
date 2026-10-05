import { describe, it, expect, vi, beforeEach } from 'vitest'

const requestJson = vi.fn()
vi.mock('@shared/api', () => ({
  requestJson: (...args) => requestJson(...args),
  cachedGridGet: vi.fn(),
  invalidateCache: vi.fn(),
}))
vi.mock('@/i18n', () => ({ default: { t: (key) => key } }))

import {
  getMyContributions,
  getConsentView,
  getConsentViewFileDownloadUrl,
  getConsentViewDocumentDownloadUrl,
} from './api'

// Bug #11: getMyContributions returned the raw response, so a wrapped object
// ({ items: [...] }) would reach ContributionsTable.map and throw.
describe('getMyContributions — always returns an array', () => {
  beforeEach(() => requestJson.mockReset())

  it('passes a plain array through unchanged', async () => {
    requestJson.mockResolvedValue([{ id: 1 }])
    expect(await getMyContributions()).toEqual([{ id: 1 }])
  })

  it('unwraps an items-wrapped object', async () => {
    requestJson.mockResolvedValue({ items: [{ id: 2 }] })
    expect(await getMyContributions()).toEqual([{ id: 2 }])
  })

  it('unwraps a content-wrapped object', async () => {
    requestJson.mockResolvedValue({ content: [{ id: 3 }] })
    expect(await getMyContributions()).toEqual([{ id: 3 }])
  })

  it('falls back to [] for an unexpected shape', async () => {
    requestJson.mockResolvedValue({ foo: 'bar' })
    expect(await getMyContributions()).toEqual([])
  })
})

describe('consent view API', () => {
  beforeEach(() => requestJson.mockReset())

  it('uses the dedicated redacted view and its download URL endpoints', async () => {
    requestJson.mockResolvedValue({ id: 'w1' })

    await getConsentView('w1')
    await getConsentViewFileDownloadUrl('w1', 'f1')
    await getConsentViewDocumentDownloadUrl('w1', 'd1')

    expect(requestJson).toHaveBeenNthCalledWith(1, '/api/v1/works/w1/consent-view')
    expect(requestJson).toHaveBeenNthCalledWith(2, '/api/v1/works/w1/consent-view/files/f1/download-url')
    expect(requestJson).toHaveBeenNthCalledWith(3, '/api/v1/works/w1/consent-view/documents/d1/download-url')
  })
})
