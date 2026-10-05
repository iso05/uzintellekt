import { render, screen, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import i18n from '@/i18n'

// Kept in sync with WorksPage's SEARCH_DEBOUNCE_MS.
const DEBOUNCE_MS = 300

// A controllable getWorks: every call parks a {resolve} so the test decides when
// and in which order responses come back. Everything else in the barrel stays
// real so the child widgets render normally.
const deferreds = []
function nextDeferred() {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  deferreds.push({ promise, resolve })
  return promise
}

const getWorksMock = vi.fn(() => nextDeferred())

vi.mock('@/entities/work', async (importActual) => {
  const actual = await importActual()
  return {
    ...actual,
    getWorks: (...args) => getWorksMock(...args),
    getMyContributions: () => Promise.resolve([]),
    // Avoid the real dictionary network calls (and their 401 noise) in tests.
    useDictionaries: () => ({ workTypes: [], authorRoles: [], loading: false }),
  }
})

import WorksPage from './WorksPage'

const page = (items, totalItems) => ({ items, totalItems })

async function resolveInitialLoads(items = [{ id: 1, name: 'First' }], totalItems = 1) {
  await act(async () => {
    deferreds[0].resolve(page(items, totalItems))
    deferreds[1].resolve(page(items, totalItems))
  })
}

function renderPage() {
  return render(
    <MemoryRouter>
      <WorksPage />
    </MemoryRouter>
  )
}

const flush = () =>
  act(async () => {
    await Promise.resolve()
  })

const advance = (ms) =>
  act(async () => {
    vi.advanceTimersByTime(ms)
    await Promise.resolve()
  })

beforeEach(async () => {
  deferreds.length = 0
  getWorksMock.mockClear()
  await i18n.changeLanguage('en')
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('WorksPage — search debounce (bug #4)', () => {
  it('issues one fetch for the initial load, not one per keystroke', async () => {
    renderPage()
    await resolveInitialLoads()
    expect(getWorksMock).toHaveBeenCalledTimes(2)

    const input = screen.getByPlaceholderText(i18n.t('works.search_ph'))
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.change(input, { target: { value: 'abc' } })

    // Before the debounce window elapses, no extra request fired.
    await advance(DEBOUNCE_MS - 50)
    expect(getWorksMock).toHaveBeenCalledTimes(2)

    // After it elapses, exactly one more request — collapsing the three keystrokes.
    await advance(100)
    expect(getWorksMock).toHaveBeenCalledTimes(3)
  })
})

describe('WorksPage — stale response guard (bug #3)', () => {
  it('keeps the newest response when an older request resolves last', async () => {
    renderPage()
    await resolveInitialLoads([{ id: 1, name: 'First work' }], 1)
    expect(screen.getByText('First work')).toBeInTheDocument()

    const input = screen.getByPlaceholderText(i18n.t('works.search_ph'))

    // Type "ab", let it settle → request #2 (in flight, deferreds[1]).
    fireEvent.change(input, { target: { value: 'ab' } })
    await advance(DEBOUNCE_MS + 10)

    // Type "abcd", let it settle → request #3 (in flight, deferreds[2]).
    fireEvent.change(input, { target: { value: 'abcd' } })
    await advance(DEBOUNCE_MS + 10)

    expect(deferreds.length).toBe(4)

    // Resolve the NEWEST (#3) first, then the older (#2) last.
    await act(async () => deferreds[3].resolve(page([{ id: 3, name: 'Newest result' }], 1)))
    await act(async () => deferreds[2].resolve(page([{ id: 2, name: 'Stale result' }], 1)))
    await flush()

    // The stale (#2) response must not have overwritten the newest (#3).
    expect(screen.getByText('Newest result')).toBeInTheDocument()
    expect(screen.queryByText('Stale result')).not.toBeInTheDocument()
  })
})
