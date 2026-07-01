import { describe, it, expect } from 'vitest'
import {
  WORK_FILE_STATUS,
  getFileExtension,
  isAllowedFile,
  formatBytes,
  quotaPercent,
  onlyUploaded,
  visibleWorkFiles,
  hasUploadedFile,
  fitsInQuota,
} from './files'

describe('getFileExtension', () => {
  it('returns the lowercased extension', () => {
    expect(getFileExtension('Report.PDF')).toBe('pdf')
    expect(getFileExtension('a.b.docx')).toBe('docx')
  })
  it('returns "" when there is no usable extension', () => {
    expect(getFileExtension('noext')).toBe('')
    expect(getFileExtension('trailingdot.')).toBe('')
    expect(getFileExtension('')).toBe('')
  })
})

describe('isAllowedFile — whitelist by extension (documents only)', () => {
  it('accepts PDF/DOC/DOCX regardless of case', () => {
    expect(isAllowedFile({ name: 'report.pdf' })).toBe(true)
    expect(isAllowedFile({ name: 'Letter.DOC' })).toBe(true)
    expect(isAllowedFile({ name: 'contract.docx' })).toBe(true)
  })
  it('rejects everything else (images, archives, sheets, extensionless)', () => {
    expect(isAllowedFile({ name: 'photo.jpg' })).toBe(false)
    expect(isAllowedFile({ name: 'archive.zip' })).toBe(false)
    expect(isAllowedFile({ name: 'sheet.xlsx' })).toBe(false)
    expect(isAllowedFile({ name: 'malware.exe' })).toBe(false)
    expect(isAllowedFile({ name: 'noextension' })).toBe(false)
    expect(isAllowedFile(undefined)).toBe(false)
  })
})

describe('formatBytes', () => {
  it('formats sizes with the right unit', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(1024 * 1024)).toBe('1 MB')
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB')
  })
  it('handles invalid/negative input as 0', () => {
    expect(formatBytes(-5)).toBe('0 B')
    expect(formatBytes(NaN)).toBe('0 B')
    expect(formatBytes(undefined)).toBe('0 B')
  })
  it('accepts localized unit labels', () => {
    expect(formatBytes(1536, { units: ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'] })).toBe('1.5 КБ')
  })
})

describe('quotaPercent', () => {
  it('computes a rounded percent', () => {
    expect(quotaPercent(50, 100)).toBe(50)
    expect(quotaPercent(1, 3)).toBe(33)
  })
  it('clamps to [0, 100] and guards a zero/invalid limit', () => {
    expect(quotaPercent(200, 100)).toBe(100)
    expect(quotaPercent(10, 0)).toBe(0)
    expect(quotaPercent(-5, 100)).toBe(0)
    expect(quotaPercent(5, NaN)).toBe(0)
  })
})

describe('onlyUploaded', () => {
  it('keeps only UPLOADED files', () => {
    const files = [
      { fileId: '1', status: WORK_FILE_STATUS.UPLOADED },
      { fileId: '2', status: WORK_FILE_STATUS.PENDING },
      { fileId: '3', status: WORK_FILE_STATUS.DELETED },
      { fileId: '4', status: WORK_FILE_STATUS.UPLOADED },
    ]
    expect(onlyUploaded(files).map((f) => f.fileId)).toEqual(['1', '4'])
  })
  it('returns [] for non-array input', () => {
    expect(onlyUploaded(null)).toEqual([])
    expect(onlyUploaded(undefined)).toEqual([])
  })
})

describe('visibleWorkFiles', () => {
  const files = [
    { fileId: '1', status: WORK_FILE_STATUS.UPLOADED },
    { fileId: '2', status: WORK_FILE_STATUS.PENDING },
    { fileId: '3', status: WORK_FILE_STATUS.EXPIRED },
    { fileId: '4', status: WORK_FILE_STATUS.DELETED },
  ]
  it('keeps UPLOADED and EXPIRED (tombstones), hides PENDING/DELETED', () => {
    expect(visibleWorkFiles(files).map((f) => f.fileId)).toEqual(['1', '3'])
  })
  it('returns [] for non-array input', () => {
    expect(visibleWorkFiles(undefined)).toEqual([])
  })
})

describe('hasUploadedFile', () => {
  it('is true only when at least one UPLOADED file exists', () => {
    expect(hasUploadedFile([{ status: WORK_FILE_STATUS.UPLOADED }])).toBe(true)
    expect(hasUploadedFile([{ status: WORK_FILE_STATUS.EXPIRED }])).toBe(false)
    expect(hasUploadedFile([{ status: WORK_FILE_STATUS.PENDING }])).toBe(false)
    expect(hasUploadedFile([])).toBe(false)
  })
})

describe('fitsInQuota', () => {
  it('fits when size <= remaining', () => {
    expect(fitsInQuota(100, 100)).toBe(true)
    expect(fitsInQuota(99, 100)).toBe(true)
  })
  it('does not fit when size exceeds remaining', () => {
    expect(fitsInQuota(101, 100)).toBe(false)
  })
  it('accounts for bytes already queued but unconfirmed', () => {
    expect(fitsInQuota(50, 100, 60)).toBe(false) // 50 > 100 - 60
    expect(fitsInQuota(40, 100, 60)).toBe(true) // 40 <= 100 - 60
  })
  it('rejects invalid sizes', () => {
    expect(fitsInQuota(0, 100)).toBe(false)
    expect(fitsInQuota(-1, 100)).toBe(false)
    expect(fitsInQuota(10, NaN)).toBe(false)
  })
  it('treats Infinity remaining as no limit (always fits)', () => {
    expect(fitsInQuota(10, Infinity)).toBe(true)
    expect(fitsInQuota(10, Infinity, 5)).toBe(true)
  })
})
