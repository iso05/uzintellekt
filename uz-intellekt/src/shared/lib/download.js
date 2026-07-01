/**
 * Trigger a browser download for a Blob.
 *
 * The object URL is revoked on a deferred tick rather than synchronously after
 * `click()` — revoking immediately can cancel the download before it starts
 * in some browsers (notably Firefox).
 *
 * @param {Blob} blob - the file contents to download
 * @param {string} filename - suggested file name
 */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
