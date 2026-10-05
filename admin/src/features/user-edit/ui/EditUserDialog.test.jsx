import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/user', async (importActual) => {
  const actual = await importActual()
  return { ...actual, updateUser: vi.fn() }
})

import { updateUser } from '@/entities/user'
import EditUserDialog from './EditUserDialog'

// Address prefilled with a real region/district so the cascade resolves both
// dropdowns from parseAddress (Radix Select selection is impractical in jsdom).
const user = {
  id: 'u1',
  role: 'USER',
  pseudonym: 'p',
  phones: ['998900000000'],
  address: 'Andijon viloyati, Andijon tumani, Mustaqillik, 45',
}

// Textboxes in the dialog, in order: [pseudonym, phone1, phone2, street, house].
const streetBox = () => screen.getAllByRole('textbox')[3]

describe('EditUserDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rebuilds the address from the geo cascade and edited street', async () => {
    updateUser.mockResolvedValue({})
    const onUpdated = vi.fn()
    const onOpenChange = vi.fn()
    render(<EditUserDialog user={user} open onOpenChange={onOpenChange} onUpdated={onUpdated} />)

    // Wait for geo to load and the street/house inputs to render (4 textboxes).
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(5))

    fireEvent.change(streetBox(), { target: { value: 'NewStreet' } })
    fireEvent.click(screen.getByRole('button', { name: 'user.form.save' }))

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith('u1', {
        role: 'USER',
        address: 'Andijon viloyati, Andijon tumani, NewStreet, 45',
        phones: ['998900000000'],
        pseudonym: 'p',
      })
    )
    expect(onUpdated).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('preserves the existing address (does not block edits) when it does not parse into the cascade', async () => {
    updateUser.mockResolvedValue({})
    const onUpdated = vi.fn()
    // A legacy/free-text address does not resolve to a region/district, so the
    // cascade is incomplete — but the admin must still be able to save role/phone.
    render(
      <EditUserDialog
        user={{ ...user, address: 'Old freeform address' }}
        open
        onOpenChange={() => {}}
        onUpdated={onUpdated}
      />
    )
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(5))

    fireEvent.click(screen.getByRole('button', { name: 'user.form.save' }))

    await waitFor(() =>
      expect(updateUser).toHaveBeenCalledWith(
        'u1',
        expect.objectContaining({ role: 'USER', address: 'Old freeform address' })
      )
    )
  })

  it('blocks save only when there is no address at all and the cascade is empty', async () => {
    const onUpdated = vi.fn()
    render(
      <EditUserDialog user={{ ...user, address: '' }} open onOpenChange={() => {}} onUpdated={onUpdated} />
    )
    await waitFor(() => expect(screen.getAllByRole('textbox')).toHaveLength(5))

    fireEvent.click(screen.getByRole('button', { name: 'user.form.save' }))

    expect(updateUser).not.toHaveBeenCalled()
    expect(onUpdated).not.toHaveBeenCalled()
  })
})
