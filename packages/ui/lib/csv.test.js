import { describe, it, expect } from 'vitest'
import { toCsv } from './csv'

const columns = [
  { header: 'Name', value: (r) => r.name },
  { header: 'Count', value: (r) => r.count },
]

describe('toCsv', () => {
  it('builds a header + rows joined by ; and CRLF', () => {
    const rows = [
      { name: 'Ali', count: 3 },
      { name: 'Vali', count: 5 },
    ]
    expect(toCsv(rows, columns)).toBe('Name;Count\r\nAli;3\r\nVali;5')
  })

  it('quotes and escapes cells containing separators, quotes or newlines', () => {
    const rows = [{ name: 'A;B "C"\nD', count: 1 }]
    expect(toCsv(rows, columns)).toBe('Name;Count\r\n"A;B ""C""\nD";1')
  })

  it('renders null/undefined as empty cells', () => {
    expect(toCsv([{ name: null, count: undefined }], columns)).toBe('Name;Count\r\n;')
  })

  it('returns just the header for an empty dataset', () => {
    expect(toCsv([], columns)).toBe('Name;Count')
  })

  it('neutralizes formula-injection cells with a leading quote', () => {
    expect(toCsv([{ name: '=cmd|calc', count: 1 }], columns)).toBe("Name;Count\r\n'=cmd|calc;1")
    expect(toCsv([{ name: '+1;2', count: 1 }], columns)).toBe('Name;Count\r\n"\'+1;2";1')
  })
})
