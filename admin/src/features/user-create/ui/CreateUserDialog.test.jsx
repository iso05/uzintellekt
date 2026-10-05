import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/entities/user', async (importActual) => {
  const actual = await importActual()
  return { ...actual, createUser: vi.fn() }
})

vi.mock('@shared/ui', async (importActual) => {
  const actual = await importActual()
  return {
    ...actual,
    Select: ({ value, onValueChange, children }) => (
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    ),
    SelectTrigger: ({ children }) => children,
    SelectValue: () => null,
    SelectContent: ({ children }) => children,
    SelectItem: ({ value, children }) => <option value={value}>{children}</option>,
  }
})

import { createUser } from '@/entities/user'
import CreateUserDialog from './CreateUserDialog'

// Default type is INDIVIDUAL → textbox order:
// [lastName, firstName, middleName, pinfl, passportSeria, birthDate, pseudonym, street]
function boxes() {
  return screen.getAllByRole('textbox')
}

describe('CreateUserDialog', () => {
  beforeEach(() => vi.clearAllMocks())

  it('blocks submission when required fields are empty', async () => {
    render(<CreateUserDialog open onOpenChange={() => {}} onCreated={() => {}} />)

    const button = screen.getByRole('button', { name: 'user.form.create' })
    await waitFor(() => expect(button).not.toBeDisabled())

    fireEvent.click(button)

    expect(createUser).not.toHaveBeenCalled()
    // Five required-field errors: lastName, firstName, region, district, street.
    expect(screen.getAllByText('user.form.required')).toHaveLength(5)
  })

  it('creates an individual with the minimal required fields', async () => {
    createUser.mockResolvedValue({ id: 'u1' })
    const onCreated = vi.fn()
    const onOpenChange = vi.fn()
    render(<CreateUserDialog open onOpenChange={onOpenChange} onCreated={onCreated} />)

    const button = screen.getByRole('button', { name: 'user.form.create' })
    await waitFor(() => expect(button).not.toBeDisabled())

    const [lastName, firstName] = boxes()
    fireEvent.change(lastName, { target: { value: 'ALIYEV' } })
    fireEvent.change(firstName, { target: { value: 'ALI' } })
    fireEvent.change(screen.getByPlaceholderText('user.form.street_ph'), { target: { value: 'Tashkent' } })

    const [, regionSelect, districtSelect] = screen.getAllByRole('combobox')
    fireEvent.change(regionSelect, { target: { value: '2' } })
    fireEvent.change(districtSelect, { target: { value: '16' } })

    fireEvent.click(button)

    await waitFor(() =>
      expect(createUser).toHaveBeenCalledWith({
        subjectType: 'INDIVIDUAL',
        type: 'INDIVIDUAL',
        address: "Andijon viloyati, Oltinko'l tumani, Tashkent",
        lastName: 'ALIYEV',
        firstName: 'ALI',
      })
    )
    expect(onCreated).toHaveBeenCalledWith({ id: 'u1' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
