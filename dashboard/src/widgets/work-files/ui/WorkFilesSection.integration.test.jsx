import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react'
import i18n from '@/i18n'

const requestJson = vi.fn()
vi.mock('@shared/api', () => ({ requestJson: (...a) => requestJson(...a) }))

import { WorkFilesSection } from '../index'

// Backend stub whose file list mutates as confirm/delete happen, so a refetch
// reflects the change — exactly what the widget relies on after each mutation.
function setupBackend({ initial = [], quota = { usedBytes: 0, limitBytes: 1_000_000, remainingBytes: 1_000_000 } } = {}) {
  let files = initial
  requestJson.mockImplementation((path, opts) => {
    const method = opts?.method || 'GET'
    if (path.endsWith('/files') && method === 'GET') return Promise.resolve(files)
    if (path.endsWith('/storage-quota')) return Promise.resolve(quota)
    if (path.endsWith('/files/init')) {
      return Promise.resolve({
        fileId: 'f1',
        uploadUrl: 'https://storage/x?sig=1',
        requiredContentType: 'application/pdf',
      })
    }
    if (path.endsWith('/confirm')) {
      const f = { fileId: 'f1', filename: 'new.pdf', sizeBytes: 10, status: 'UPLOADED' }
      files = [f]
      return Promise.resolve(f)
    }
    if (method === 'DELETE') {
      files = []
      return Promise.resolve(null)
    }
    return Promise.resolve(null)
  })
}

// Auto-succeeding presigned PUT.
class MockXHR {
  constructor() {
    this.upload = {}
    this.headers = {}
  }
  open(m, u) {
    this.method = m
    this.url = u
  }
  setRequestHeader(k, v) {
    this.headers[k] = v
  }
  send() {
    Promise.resolve().then(() => {
      this.status = 200
      this.upload.onprogress?.({ lengthComputable: true, loaded: 10, total: 10 })
      this.onload?.()
    })
  }
}

describe('WorkFilesSection — integration', () => {
  beforeEach(async () => {
    requestJson.mockReset()
    await i18n.changeLanguage('ru')
  })
  afterEach(() => vi.unstubAllGlobals())

  it('uploads a dropped file (init → PUT → confirm) and shows it in the list', async () => {
    setupBackend()
    vi.stubGlobal('XMLHttpRequest', MockXHR)

    const { container } = render(<WorkFilesSection workId="w1" />)
    await screen.findByText('Файлов пока нет')

    const input = container.querySelector('input[type=file]')
    const file = new File(['hello'], 'new.pdf', { type: 'application/pdf' })
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } })
    })

    await screen.findByText('new.pdf')
    await waitFor(() => {
      expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files/init', expect.objectContaining({ method: 'POST' }))
      expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files/f1/confirm', { method: 'POST' })
    })
  })

  it('auto-uploads initialFiles handed in from the parent (post auto-draft)', async () => {
    setupBackend()
    vi.stubGlobal('XMLHttpRequest', MockXHR)

    const file = new File(['hello'], 'new.pdf', { type: 'application/pdf' })
    await act(async () => {
      render(<WorkFilesSection workId="w1" initialFiles={[file]} />)
    })

    await screen.findByText('new.pdf')
    await waitFor(() =>
      expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files/f1/confirm', { method: 'POST' })
    )
  })

  it('deletes a file after confirming in the alert dialog', async () => {
    setupBackend({
      initial: [{ fileId: 'f1', filename: 'doc.pdf', sizeBytes: 2048, status: 'UPLOADED' }],
    })

    render(<WorkFilesSection workId="w1" />)
    await screen.findByText('doc.pdf')

    fireEvent.click(screen.getByLabelText('Удалить'))
    const dialog = await screen.findByRole('alertdialog')
    fireEvent.click(within(dialog).getByText('Удалить'))

    await waitFor(() =>
      expect(requestJson).toHaveBeenCalledWith('/api/v1/works/w1/files/f1', { method: 'DELETE' })
    )
    await screen.findByText('Файлов пока нет')
  })
})
