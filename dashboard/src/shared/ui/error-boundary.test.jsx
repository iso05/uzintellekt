import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest'
import i18n from '@/i18n'
import { ErrorBoundary } from './error-boundary'

function Boom() {
  throw new Error('boom')
}

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  it('renders the fallback when a child throws, not a blank screen', () => {
    // React logs the caught error — silence it to keep test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(i18n.t('common.crash_title'))).toBeInTheDocument()
  })

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('safe content')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears the error when resetKey changes (e.g. route navigation)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { rerender } = render(
      <ErrorBoundary resetKey="/works">
        <Boom />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()

    rerender(
      <ErrorBoundary resetKey="/profile">
        <div>recovered</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('recovered')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
