// Minimal, dependency-free CSV export.
// Uses ';' as the separator and prepends a UTF-8 BOM so Excel (incl. ru/uz
// locales) opens the file with correct columns and Cyrillic text.

// U+FEFF byte-order mark, built at runtime to keep the source ASCII-only.
const BOM = String.fromCharCode(0xfeff)

function escapeCell(value) {
  let s = value == null ? '' : String(value)
  // Neutralize spreadsheet formula injection: a leading =,+,-,@,tab or CR makes
  // Excel/LibreOffice evaluate the cell, so prefix a quote to force plain text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/**
 * @param {Array<object>} rows
 * @param {Array<{header: string, value: (row) => any}>} columns
 * @returns {string} CSV text
 */
export function toCsv(rows, columns) {
  const head = columns.map((c) => escapeCell(c.header)).join(';')
  const body = (rows || [])
    .map((row) => columns.map((c) => escapeCell(c.value(row))).join(';'))
    .join('\r\n')
  return body ? `${head}\r\n${body}` : head
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
