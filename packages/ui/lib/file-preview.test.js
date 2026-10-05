import { describe, expect, it } from 'vitest'
import { getFileExtension, getOfficePreviewUrl } from './file-preview'

describe('file preview helpers', () => {
  it('recognizes Word document extensions regardless of case', () => {
    expect(getFileExtension('Proof.DOCX')).toBe('docx')
    expect(getFileExtension('archive.doc')).toBe('doc')
  })

  it('encodes a temporary storage URL for the Office browser viewer', () => {
    expect(getOfficePreviewUrl('https://storage.example/file.docx?signature=a&expires=1'))
      .toBe('https://view.officeapps.live.com/op/view.aspx?src=https%3A%2F%2Fstorage.example%2Ffile.docx%3Fsignature%3Da%26expires%3D1')
  })
})
