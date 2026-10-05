/**
 * Copy text to clipboard with fallback for non-secure HTTP contexts (IP addresses / HTTP).
 */
export async function copyToClipboard(text) {
  if (text == null || text === '') return false
  const str = String(text)

  // Try modern Clipboard API if supported and in secure context
  try {
    if (navigator.clipboard && (window.isSecureContext || window.location.protocol === 'https:')) {
      await navigator.clipboard.writeText(str)
      return true
    }
  } catch {
    // Fall back to execCommand below
  }

  // Fallback for HTTP / non-secure contexts
  try {
    const textArea = document.createElement('textarea')
    textArea.value = str
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    textArea.setAttribute('readonly', '')
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Copy fallback failed:', err)
    return false
  }
}
