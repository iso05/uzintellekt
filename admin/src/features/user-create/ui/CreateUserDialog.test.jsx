import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/user', async (importActual) => {
  const actual = await importActual()
  return { ...actual, createUser: vi.fn() }
})

import { createUser } from '@/entities/user'
import CreateUserDialog from './CreateUserDialog'

// Default type is INDIVIDUAL → textbox order:
// [lastName, firstName, middleName, pinfl, passportSeria, birthDate, pseudonym, phones, address]
function boxes() {
  return screen.getAllByRole('textbox')
}

describe('CreateUserDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks submission when required fields are empty', () => {
    render(<CreateUserDialog open onOpenChange={() => {}} onCreated={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'user.form.create' }))

    expect(createUser).not.toHaveBeenCalled()
    // Three required-field errors: lastName, firstName, address.
    expect(screen.getAllByText('user.form.required')).toHaveLength(3)
  })

  it('creates an individual with the minimal required fields', async () => {
    createUser.mockResolvedValue({ id: 'u1' })
    const onCreated = vi.fn()
    const onOpenChange = vi.fn()
    render(<CreateUserDialog open onOpenChange={onOpenChange} onCreated={onCreated} />)

    const [lastName, firstName] = boxes()
    fireEvent.change(lastName, { target: { value: 'ALIYEV' } })
    fireEvent.change(firstName, { target: { value: 'ALI' } })
    fireEvent.change(boxes()[8], { target: { value: 'Tashkent' } })

    fireEvent.click(screen.getByRole('button', { name: 'user.form.create' }))

    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith({
        type: 'INDIVIDUAL',
        address: 'Tashkent',
        lastName: 'ALIYEV',
        firstName: 'ALI',
      })
    )
    expect(onCreated).toHaveBeenCalledWith({ id: 'u1' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
