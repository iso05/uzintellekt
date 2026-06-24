import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AppRouter from '@/router/AppRouter'
import { AuthProvider } from '@/hooks/useAuth'

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <AppRouter />
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('AppRouter smoke', () => {
  it('renders Home at /', () => {
    renderAt('/')
    expect(screen.getAllByText(/Himoya|Protect|Защит/i).length).toBeGreaterThan(0)
  })

  it('renders About at /about', () => {
    renderAt('/about')
    expect(screen.getAllByText(/Biz haqimizda|About Us|О нас/i).length).toBeGreaterThan(0)
  })

  it('renders NotFound at unknown route', () => {
    renderAt('/this-page-does-not-exist')
    expect(
      screen.getByText(/Sahifa topilmadi|Page Not Found|Страница не найдена/i)
    ).toBeInTheDocument()
  })
})
