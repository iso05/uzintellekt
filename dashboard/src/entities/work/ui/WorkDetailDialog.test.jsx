import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeAll, vi } from 'vitest'
import i18n from '@/i18n'

// Dictionary roles come from the backend, not i18n — stub the hook so the test
// is deterministic and offline.
vi.mock('../model/use-dictionaries', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useDictionaries: () => ({
      workTypes: [{ id: 1, name: 'Book' }],
      authorRoles: [
        { id: 7, name: 'Author' },
        { id: 8, name: 'Composer' },
      ],
      loading: false,
    }),
  }
})

import WorkDetailDialog from './WorkDetailDialog'

// en avoids the uz-Cyrl transliteration of resolveLocalizedName so we can assert
// on the raw role name.
beforeAll(async () => {
  await i18n.changeLanguage('en')
})

// Bug #2: the dialog renders the RAW backend work (getWork returns items[0]
// untransformed). The backend ships holder roles under `authorRoles`, but the
// dialog reads `rh.authorRoleIds` (a UI-only field created by fromBackend), so
// `|| []` masks the mismatch and the Role column is always "—".
describe('WorkDetailDialog — author roles from backend-shaped holders', () => {
  it('renders the author role name when roles arrive under `authorRoles`', () => {
    const work = {
      name: 'Test work',
      state: 'DRAFT',
      workTypeId: 1,
      rightHolders: [
        {
          passportNo: 'AB1234567',
          firstName: 'Ali',
          lastName: 'Valiyev',
          sharePercentage: 100,
          authorRoles: [7], // backend field name, not authorRoleIds
        },
      ],
    }

    render(<WorkDetailDialog work={work} open onOpenChange={() => {}} />)

    expect(screen.getByText('Author')).toBeInTheDocument()
  })
})
