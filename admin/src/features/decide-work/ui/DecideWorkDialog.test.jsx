import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/work', () => ({ decideWork: vi.fn() }))

import { decideWork } from '@/entities/work'
import DecideWorkDialog from './DecideWorkDialog'

const work = { id: 'w1', name: 'Test work' }

function setup(decision) {
  const onOpenChange = vi.fn()
  const onDecided = vi.fn()
  render(
    <DecideWorkDialog
      work={work}
      decision={decision}
      open
      onOpenChange={onOpenChange}
      onDecided={onDecided}
    />
  )
  return { onOpenChange, onDecided }
}

// The confirm button carries the decide.reject / decide.approve label (i18n keys
// echo back without a provider); the other button is common.cancel.
function confirmButton(decision) {
  return screen.getByRole('button', { name: decision === 'REJECT' ? 'decide.reject' : 'decide.approve' })
}

describe('DecideWorkDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks a rejection with no reason and shows a validation error', () => {
    const { onDecided } = setup('REJECT')

    fireEvent.click(confirmButton('REJECT'))

    expect(screen.getByText('decide.reason_required')).toBeInTheDocument()
    expect(decideWork).not.toHaveBeenCalled()
    expect(onDecided).not.toHaveBeenCalled()
  })

  it('rejects with a reason, then notifies the caller', async () => {
    decideWork.mockResolvedValue({})
    const { onDecided, onOpenChange } = setup('REJECT')

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'missing scan' } })
    fireEvent.click(confirmButton('REJECT'))

    await waitFor(() =>
      expect(decideWork).toHaveBeenCalledWith('w1', { decision: 'REJECT', reason: 'missing scan' })
    )
    expect(onDecided).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('approves without requiring a reason', async () => {
    decideWork.mockResolvedValue({})
    const { onDecided } = setup('APPROVE')

    fireEvent.click(confirmButton('APPROVE'))

    await waitFor(() =>
      expect(decideWork).toHaveBeenCalledWith('w1', { decision: 'APPROVE', reason: undefined })
    )
    expect(onDecided).toHaveBeenCalledTimes(1)
  })
})
