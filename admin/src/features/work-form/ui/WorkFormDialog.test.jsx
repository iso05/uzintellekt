import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/work', () => ({ createWorkForUser: vi.fn(), updateWork: vi.fn() }))
vi.mock('@/entities/dictionary', () => ({
  useWorkTypeOptions: () => [{ id: 1, label: 'Type 1' }],
  useAuthorRoleOptions: () => [{ id: 1, label: 'Author' }],
}))

import { createWorkForUser, updateWork } from '@/entities/work'
import WorkFormDialog from './WorkFormDialog'

describe('WorkFormDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks creation when required fields are empty', () => {
    render(<WorkFormDialog mode="create" userId="u1" open onOpenChange={() => {}} onDone={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'work.form.create' }))

    expect(createWorkForUser).not.toHaveBeenCalled()
  })

  it('blocks creation when shares do not total 100 and shows the share error', () => {
    render(<WorkFormDialog mode="create" userId="u1" open onOpenChange={() => {}} onDone={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'work.form.add_holder' }))
    const shareInputs = screen.getAllByPlaceholderText('work.form.share')
    fireEvent.change(shareInputs[0], { target: { value: '30' } })
    fireEvent.change(shareInputs[1], { target: { value: '30' } })

    fireEvent.click(screen.getByRole('button', { name: 'work.form.create' }))

    expect(createWorkForUser).not.toHaveBeenCalled()
    expect(screen.getByText('work.form.share_error')).toBeInTheDocument()
  })

  it('saves an edited work, mapping right-holder role ids to authorRoles', async () => {
    updateWork.mockResolvedValue({ id: 'w1' })
    const onDone = vi.fn()
    const onOpenChange = vi.fn()
    const work = {
      id: 'w1',
      name: 'My work',
      workTypeId: 1,
      description: 'desc',
      rightHolders: [
        { lastName: 'ALIYEV', firstName: 'ALI', passportNo: 'AB123', sharePercentage: 100, authorRoleIds: [1] },
      ],
    }
    render(<WorkFormDialog mode="edit" work={work} open onOpenChange={onOpenChange} onDone={onDone} />)

    fireEvent.click(screen.getByRole('button', { name: 'user.form.save' }))

    await waitFor(() =>
      expect(updateWork).toHaveBeenCalledWith('w1', {
        name: 'My work',
        description: 'desc',
        workTypeId: 1,
        rightHolders: [
          { passportNo: 'AB123', firstName: 'ALI', lastName: 'ALIYEV', sharePercentage: 100, authorRoles: [1] },
        ],
      })
    )
    expect(onDone).toHaveBeenCalledWith({ id: 'w1' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
