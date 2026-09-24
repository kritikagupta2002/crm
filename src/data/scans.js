import { TODAY } from './mockData'

/*
 * The office scanner saves every government letter straight into a folder on the QNAP NAS (requirement WP6,
 * vendor sheet A3 and flowchart 3, step 1). Scans in that folder wait in the inbox until someone files each one
 * against its project (step 2). These are the scans waiting in the demo; new ones come in by upload.
 */
export const SCAN_FOLDER = '\\\\QNAP-NAS\\Scans\\Govt-Letters'
export const SCANNER = 'Front office scanner'

const at = (daysAgo, time) => {
  const d = new Date(TODAY.getTime() - daysAgo * 86_400_000)
  const [h, m] = time.split(':').map(Number)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const name = (iso) => {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `SCAN_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.pdf`
}

export const SEEDED_SCANS = [
  { daysAgo: 0, time: '10:42', pages: 2, size: 684_000 },
  { daysAgo: 1, time: '16:05', pages: 1, size: 312_000 },
  { daysAgo: 2, time: '11:18', pages: 3, size: 1_046_000 },
].map((s, i) => {
  const scannedAt = at(s.daysAgo, s.time)
  return { id: `SCN-${i + 1}`, name: name(scannedAt), scannedAt, pages: s.pages, size: s.size, type: 'application/pdf', scanner: SCANNER, seeded: true }
})
