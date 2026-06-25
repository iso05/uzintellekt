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
      holder({ passportNo: 'AB1234567' }),
      holder({ passportNo: 'CD7654321' }),
    ])
    expect(errors).toEqual({})
  })

  it('flags the second+ occurrence, not the first', () => {
    const errors = findDuplicatePassportErrors([
      holder({ passportNo: 'AB1234567' }),
      holder({ passportNo: 'AB1234567' }),
      holder({ passportNo: 'AB1234567' }),
    ])
    expect(errors['rightHolders[0].passportNo']).toBeUndefined()
    expect(errors['rightHolders[1].passportNo']).toEqual({ key: 'validation.passport_dup' })
    expect(errors['rightHolders[2].passportNo']).toEqual({ key: 'validation.passport_dup' })
  })

  it('is case-insensitive and trims whitespace', () => {
    const errors = findDuplicatePassportErrors([
      holder({ passportNo: 'ab1234567' }),
      holder({ passportNo: '  AB1234567  ' }),
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
        passportNo: 'AB1234567',
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
        passportNo: 'AB1234567',
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
          passportNo: 'AB1234567',
          firstName: 'A',
          lastName: 'B',
          share: '50',
          authorRoleIds: ['1'],
        }),
        holder({
          passportNo: 'AB1234567',
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
          passportNo: 'AB1234567',
          firstName: 'Ali',
          lastName: 'Valiyev',
          share: '100',
          authorRoleIds: ['1', '2'],
        }),
      ],
    })
    expect(payload).toEqual({
      name: 'Title',
      description: 'Desc',
      workTypeId: 5,
      rightHolders: [
        {
          passportNo: 'AB1234567',
          firstName: 'Ali',
          lastName: 'Valiyev',
          sharePercentage: 100,
          authorRoles: [1, 2],
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
