import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/contract', async (importActual) => {
  const actual = await importActual()
  return { ...actual, signContract: vi.fn() }
})

import { signContract } from '@/entities/contract'
import SignContractDialog from './SignContractDialog'

const user = { id: 'u1', pseudonym: '', address: 'Tashkent', phones: ['998900000000'] }

describe('SignContractDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('requires a signature image before signing', () => {
    render(<SignContractDialog user={user} open onOpenChange={() => {}} onDone={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'contract.sign' }))

    expect(signContract).not.toHaveBeenCalled()
    expect(screen.getByText('user.form.required')).toBeInTheDocument()
  })

  it('signs on behalf of the user with the uploaded signature', async () => {
    signContract.mockResolvedValue()
    const onDone = vi.fn()
    const onOpenChange = vi.fn()
    render(<SignContractDialog user={user} open onOpenChange={onOpenChange} onDone={onDone} />)

    const sig = new File(['png'], 'sign.png', { type: 'image/png' })
    const fileInput = document.querySelector('input[type="file"]')
    fireEvent.change(fileInput, { target: { files: [sig] } })

    fireEvent.click(screen.getByRole('button', { name: 'contract.sign' }))

    await waitFor(() =>
      expect(signContract).toHaveBeenCalledWith('u1', {
        contractType: 'MEMBERSHIP',
        pseudonym: undefined,
        address: 'Tashkent',
        phones: ['998900000000'],
        signatureImage: sig,
      })
    )
    expect(onDone).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
