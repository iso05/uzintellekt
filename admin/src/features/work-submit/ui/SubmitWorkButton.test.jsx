import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/work', () => ({ submitWork: vi.fn() }))

import { submitWork } from '@/entities/work'
import SubmitWorkButton from './SubmitWorkButton'

describe('SubmitWorkButton', () => {
  beforeEach(() => vi.clearAllMocks())

  it('submits the work after confirmation', async () => {
    submitWork.mockResolvedValue()
    const onDone = vi.fn()
    render(<SubmitWorkButton work={{ id: 'w1', name: 'W' }} onDone={onDone} />)

    // Open the confirm dialog, then click the confirm action (same label as trigger).
    fireEvent.click(screen.getByRole('button', { name: 'work.submit.action' }))
    const actions = screen.getAllByText('work.submit.action')
    fireEvent.click(actions[actions.length - 1])

    await waitFor(() => expect(submitWork).toHaveBeenCalledWith('w1'))
    expect(onDone).toHaveBeenCalled()
  })
})
