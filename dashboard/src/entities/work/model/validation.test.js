import { describe, it, expect } from 'vitest'
import {
  EMPTY_HOLDER,
  buildHolderErrorKey,
  findDuplicatePassportErrors,
  validateHolder,
  validateWorkForm,
  computeShareTotal,
  getShareTotalError,
  toPayload,
} from './validation'

const holder = (over = {}) => ({ ...EMPTY_HOLDER, ...over })

describe('buildHolderErrorKey', () => {
  it('maps UI keys to API field names', () => {
    expect(buildHolderErrorKey(0, 'share')).toBe('rightHolders[0].sharePercentage')
    expect(buildHolderErrorKey(1, 'authorRoleIds')).toBe('rightHolders[1].authorRoles')
    expect(buildHolderErrorKey(2, 'passportNo')).toBe('rightHolders[2].passportNo')
  })
})

describe('findDuplicatePassportErrors', () => {
  it('returns empty when no duplicates', () => {
    const errors = findDuplicatePassportErrors([
      holder({ passportNo: '30101961234509' }),
      holder({ passportNo: '40101961234506' }),
    ])
    expect(errors).toEqual({})
  })

  it('flags the second+ occurrence, not the first', () => {
    const errors = findDuplicatePassportErrors([
      holder({ passportNo: '30101961234509' }),
      holder({ passportNo: '30101961234509' }),
      holder({ passportNo: '30101961234509' }),
    ])
    expect(errors['rightHolders[0].passportNo']).toBeUndefined()
    expect(errors['rightHolders[1].passportNo']).toEqual({ key: 'validation.passport_dup' })
    expect(errors['rightHolders[2].passportNo']).toEqual({ key: 'validation.passport_dup' })
  })

  it('is case-insensitive and trims whitespace', () => {
    const errors = findDuplicatePassportErrors([
      holder({ passportNo: '30101961234509' }),
      holder({ passportNo: '  30101961234509  ' }),
    ])
    expect(errors['rightHolders[1].passportNo']).toBeDefined()
  })

  it('ignores empty passports', () => {
    const errors = findDuplicatePassportErrors([
      holder({ passportNo: '' }),
      holder({ passportNo: '' }),
    ])
    expect(errors).toEqual({})
  })
})

describe('computeShareTotal', () => {
  it('sums numeric share values', () => {
    expect(computeShareTotal([holder({ share: '30' }), holder({ share: '70' })])).toBe(100)
  })

  it('treats blank as zero', () => {
    expect(computeShareTotal([holder({ share: '' }), holder({ share: '50' })])).toBe(50)
  })
})

describe('getShareTotalError', () => {
  it('returns null at exactly 100', () => {
    expect(getShareTotalError([holder({ share: '100' })])).toBeNull()
  })

  it('errors when total is not 100', () => {
    expect(getShareTotalError([holder({ share: '50' })])).toEqual({
      key: 'validation.share_total_simple',
    })
    expect(getShareTotalError([holder({ share: '120' })])).toEqual({
      key: 'validation.share_total_simple',
    })
  })
})

describe('validateHolder', () => {
  it('passes for a fully valid holder', () => {
    const errors = validateHolder(
      holder({
        passportNo: '30101961234509',
        firstName: 'Ali',
        lastName: 'Valiyev',
        share: '100',
        authorRoleIds: ['1'],
      }),
      0
    )
    expect(errors).toEqual({})
  })

  it('reports missing role', () => {
    const errors = validateHolder(
      holder({
        passportNo: '30101961234509',
        firstName: 'Ali',
        lastName: 'Valiyev',
        share: '100',
        authorRoleIds: [],
      }),
      0
    )
    expect(errors['rightHolders[0].authorRoles']).toEqual({ key: 'validation.role_required' })
  })
})

describe('validateWorkForm', () => {
  it('runs per-holder + cross-holder dup check', () => {
    const errors = validateWorkForm({
      name: 'Test',
      workTypeId: '1',
      rightHolders: [
        holder({
          passportNo: '30101961234509',
          firstName: 'A',
          lastName: 'B',
          share: '50',
          authorRoleIds: ['1'],
        }),
        holder({
          passportNo: '30101961234509',
          firstName: 'C',
          lastName: 'D',
          share: '50',
          authorRoleIds: ['1'],
        }),
      ],
    })
    expect(errors['rightHolders[1].passportNo']).toEqual({ key: 'validation.passport_dup' })
  })

  it('flags missing top-level fields', () => {
    const errors = validateWorkForm({
      name: '',
      workTypeId: '',
      rightHolders: [holder()],
    })
    expect(errors.name).toEqual({
      key: 'validation.field_required',
      params: { field: { key: 'validation.field_work_name' } },
    })
    expect(errors.workTypeId).toEqual({ key: 'validation.type_required' })
  })
})

describe('toPayload', () => {
  it('shapes UI form into backend request', () => {
    const payload = toPayload({
      name: '  Title  ',
      description: '  Desc  ',
      workTypeId: '5',
      rightHolders: [
        holder({
          passportNo: '30101961234509',
          firstName: 'Ali',
          lastName: 'Valiyev',
          share: '100',
          authorRoleIds: ['1', '2'],
          ownerType: 'CONTRACT',
          contractFiles: ['test.pdf'],
        }),
      ],
    })
    expect(payload).toEqual({
      name: 'Title',
      description: 'Desc',
      workTypeId: 5,
      rightHolders: [
        {
          passportNo: '30101961234509',
          ownerType: 'AUTHOR',
          rightHolderType: 'AUTHOR',
          subjectType: 'INDIVIDUAL',
          pinfl: '30101961234509',
          firstName: 'ALI',
          lastName: 'VALIYEV',
          inn: null,
          legalName: null,
          sharePercentage: 100,
          authorRoles: [1, 2],
          contractFile: 'test.pdf',
          contractFiles: ['test.pdf'],
        },
      ],
    })
  })

  it('omits description when blank', () => {
    const payload = toPayload({
      name: 'X',
      description: '   ',
      workTypeId: '1',
      rightHolders: [],
    })
    expect(payload.description).toBeUndefined()
  })
})

// Bug #1: getShareTotalError compares the float sum to 100 with strict `!==`,
// so valid 2-decimal shares that drift in IEEE-754 (e.g. 16.10+48.20+35.70 =
// 100.00000000000001) are rejected and the work cannot be saved. The
// rounding-safe validateShareTotal already exists in shared/lib/validators.js
// but is dead code on the save path.
describe('getShareTotalError — floating-point share total', () => {
  const driftHolders = () => [
    holder({ share: '16.10' }),
    holder({ share: '48.20' }),
    holder({ share: '35.70' }),
  ]

  it('rounds away IEEE-754 drift so 16.10 + 48.20 + 35.70 totals exactly 100', () => {
    // Raw float sum is 100.00000000000001; computeShareTotal rounds to 2 decimals.
    expect(computeShareTotal(driftHolders())).toBe(100)
  })

  it('accepts shares that mathematically total 100% (16.10 + 48.20 + 35.70)', () => {
    expect(getShareTotalError(driftHolders())).toBeNull()
  })

  it('still rejects a genuine non-100 total', () => {
    const holders = [holder({ share: '50' }), holder({ share: '40' })]
    expect(getShareTotalError(holders)).not.toBeNull()
  })
})
