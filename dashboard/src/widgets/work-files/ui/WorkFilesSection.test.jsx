import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import i18n from '@/i18n'

// Fake the network layer; the real entity api functions run on top of it.
const requestJson = vi.fn()
vi.mock('@shared/api', () => ({ requestJson: (...a) => requestJson(...a) }))

import { WorkFilesSection } from '../index'

function mockBackend({ files = [], quota = { usedBytes: 0, limitBytes: 1000, remainingBytes: 1000 } } = {}) {
  requestJson.mockImplementation((path) => {
    if (path.endsWith('/files')) return Promise.resolve(files)
    if (path.endsWith('/storage-quota')) return Promise.resolve(quota)
    return Promise.resolve(null)
  })
}

describe('WorkFilesSection', () => {
  beforeEach(async () => {
    requestJson.mockReset()
    await i18n.changeLanguage('ru')
  })

  it('loads files + quota and shows the empty state when there are none', async () => {
    mockBackend()
    render(<WorkFilesSection workId="w1" />)

    await waitFor(() =>
      expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files')
    )
    expect(requestJson).toHaveBeenCalledWith('/api/v1/me/storage-quota')
    await screen.findByText('Файлов пока нет')
  })

  it('lists uploaded files with a download control', async () => {
    mockBackend({
      files: [{ fileId: 'f1', filename: 'doc.pdf', sizeBytes: 2048, status: 'UPLOADED' }],
    })
    render(<WorkFilesSection workId="w1" />)

    await screen.findByText('doc.pdf')
    expect(screen.getByLabelText('Скачать')).toBeInTheDocument()
    expect(screen.getByLabelText('Удалить')).toBeInTheDocument()
  })

  it('hides delete (and dropzone) in read-only mode', async () => {
    mockBackend({
      files: [{ fileId: 'f1', filename: 'doc.pdf', sizeBytes: 2048, status: 'UPLOADED' }],
    })
    render(<WorkFilesSection workId="w1" readOnly />)

    await screen.findByText('doc.pdf')
    expect(screen.getByLabelText('Скачать')).toBeInTheDocument()
    expect(screen.queryByLabelText('Удалить')).not.toBeInTheDocument()
  })
})
