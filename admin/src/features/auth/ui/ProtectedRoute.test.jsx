import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('../model/use-auth', () => ({ useAuth: vi.fn() }))

import { useAuth } from '../model/use-auth'
import ProtectedRoute from './ProtectedRoute'

function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>protected content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>login screen</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => vi.clearAllMocks())

  it('redirects an anonymous visitor to /login', () => {
    useAuth.mockReturnValue({ user: null, loading: false, authError: null })
    renderAt('/')
    expect(screen.getByText('login screen')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders children for an authenticated admin', () => {
    useAuth.mockReturnValue({ user: { role: 'ADMIN' }, loading: false, authError: null })
    renderAt('/')
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })

  it('shows a spinner while auth is resolving', () => {
    useAuth.mockReturnValue({ user: null, loading: true, authError: null })
    renderAt('/')
    expect(screen.queryByText('login screen')).not.toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })
})
