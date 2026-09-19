/*
 * Downloads rows as a CSV file that opens directly in Excel.
 * The BOM makes Excel read it as UTF-8, so "₹" and Hindi names show correctly.
 */
export function downloadCsv(filename, columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value)
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const lines = [columns.map((c) => escape(c.label)).join(','), ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(','))]
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
