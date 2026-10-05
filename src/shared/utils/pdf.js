/*
 * A text PDF built by hand (PDF 1.4, Helvetica) — enough for demo letters and document copies,
 * with no library. Lines: [{ text, size?, bold?, gap? }]; long lines wrap.
 */
const PAGE_W = 595
const PAGE_H = 842
const MARGIN = 56

// Helvetica's standard encoding has no ₹ or typographic dashes/quotes; keep the text readable.
const clean = (s) =>
  String(s)
    .replace(/₹\s?/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/·/g, '-')
    .replace(/[^\x20-\x7e]/g, '')
const escape = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

function wrap(text, size) {
  const max = Math.floor((PAGE_W - MARGIN * 2) / (size * 0.5))
  const words = clean(text).split(' ')
  const lines = ['']
  words.forEach((word) => {
    const last = lines[lines.length - 1]
    if ((last + ' ' + word).trim().length > max) lines.push(word)
    else lines[lines.length - 1] = (last + ' ' + word).trim()
  })
  return lines
}

export function textPdf(lines) {
  // Lines flow onto as many A4 pages as they need.
  const pages = [[]]
  let y = PAGE_H - MARGIN
  lines.forEach(({ text = '', size = 11, bold = false, gap = 6 }) => {
    wrap(text, size).forEach((line) => {
      if (y - (size + 3) < MARGIN) {
        pages.push([])
        y = PAGE_H - MARGIN
      }
      y -= size + 3
      pages[pages.length - 1].push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${MARGIN} ${y} Td (${escape(line)}) Tj ET`)
    })
    y -= gap
  })
  // Objects: 1 catalog, 2 pages, 3-4 fonts, then a page and its content stream for each page.
  const pageRef = (i) => 5 + i * 2
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pages.map((_, i) => `${pageRef(i)} 0 R`).join(' ')}] /Count ${pages.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]
  pages.forEach((ops, i) => {
    const stream = ops.join('\n')
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageRef(i) + 1} 0 R >>`)
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`)
  })
  let body = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((obj, i) => {
    offsets.push(body.length)
    body += `${i + 1} 0 obj\n${obj}\nendobj\n`
  })
  const xref = body.length
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((o) => (body += `${String(o).padStart(10, '0')} 00000 n \n`))
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([body], { type: 'application/pdf' })
}
