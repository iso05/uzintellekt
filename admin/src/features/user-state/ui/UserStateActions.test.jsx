import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/user', async (importActual) => {
  const actual = await importActual()
  return { ...actual, blockUser: vi.fn(), activateUser: vi.fn() }
})

import { blockUser, activateUser } from '@/entities/user'
import UserStateActions from './UserStateActions'

describe('UserStateActions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers Block for an active user and blocks on confirm', async () => {
    blockUser.mockResolvedValue()
    const onChanged = vi.fn()
    render(<UserStateActions user={{ id: 'u1', state: 'ACTIVE', firstName: 'A', lastName: 'B' }} onChanged={onChanged} />)

    // Open the confirmation, then confirm (two 'user.block'-labelled buttons appear).
    fireEvent.click(screen.getByRole('button', { name: 'user.block' }))
    const confirmButtons = screen.getAllByText('user.block')
    fireEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(blockUser).toHaveBeenCalledWith('u1'))
    expect(onChanged).toHaveBeenCalled()
    expect(activateUser).not.toHaveBeenCalled()
  })

  it('offers Activate for a blocked user and activates on confirm', async () => {
    activateUser.mockResolvedValue()
    const onChanged = vi.fn()
    render(<UserStateActions user={{ id: 'u9', state: 'BLOCKED', firstName: 'A', lastName: 'B' }} onChanged={onChanged} />)

    fireEvent.click(screen.getByRole('button', { name: 'user.activate' }))
    const confirmButtons = screen.getAllByText('user.activate')
    fireEvent.click(confirmButtons[confirmButtons.length - 1])

    await waitFor(() => expect(activateUser).toHaveBeenCalledWith('u9'))
    expect(onChanged).toHaveBeenCalled()
    expect(blockUser).not.toHaveBeenCalled()
  })

  it('renders nothing for a deleted user', () => {
    const { container } = render(<UserStateActions user={{ id: 'u3', state: 'DELETED' }} onChanged={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
