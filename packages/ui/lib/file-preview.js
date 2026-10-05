const OFFICE_EXTENSIONS = new Set(['doc', 'docx'])

export function getFileExtension(filename = '') {
  const cleanName = String(filename).split('?')[0].split('#')[0]
  const dot = cleanName.lastIndexOf('.')
  return dot === -1 ? '' : cleanName.slice(dot + 1).toLowerCase()
}

export function getOfficePreviewUrl(downloadUrl) {
  return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(downloadUrl)}`
}

/**
 * Opens a temporary download URL as a preview. PDFs remain in the browser's
 * native PDF viewer; Word documents use Microsoft Office's browser viewer.
 * The storage URL is short-lived and is never persisted by the application.
 */
export function openFilePreview(downloadUrl, filename) {
  if (!downloadUrl) return false

  const extension = getFileExtension(filename)
  const targetUrl = OFFICE_EXTENSIONS.has(extension)
    ? getOfficePreviewUrl(downloadUrl)
    : downloadUrl

  const previewWindow = window.open(targetUrl, '_blank', 'noopener')
  return Boolean(previewWindow)
}
