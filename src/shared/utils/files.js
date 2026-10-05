import { formatDate } from './date'
import { textPdf } from './pdf'

/*
 * Files uploaded in this browser session are kept in memory so they can be downloaded again.
 * The demo stores only file details, so after a refresh (or for sample records) a download
 * gives a generated PDF copy instead.
 */
const sessionFiles = new Map()

export const rememberFile = (id, file) => sessionFiles.set(id, file)

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const pdfName = (name) => (/\.pdf$/i.test(name) ? name : `${name.replace(/\.[^.]+$/, '')}.pdf`)

/* A document from a lead's Documents list: the real file if we still have it, else a placeholder copy. */
export function downloadDocument(doc, { company, companyName }) {
  const file = sessionFiles.get(doc.id)
  if (file) return downloadBlob(doc.name, file)
  downloadBlob(
    pdfName(doc.name),
    textPdf([
      { text: companyName, size: 16, bold: true },
      { text: `Document: ${doc.name}`, size: 12, bold: true, gap: 10 },
      { text: `Client: ${company}` },
      { text: `Added on: ${formatDate(doc.addedOn)}`, gap: 18 },
      { text: 'This is a demo copy. In the live system the original file is stored on the document server and downloaded here.', size: 10 },
    ]),
  )
}

/* An official letter recorded against a project (approval order, notice, acknowledgement). */
export function downloadLetter(letter, { project, lead, companyName }) {
  const file = letter.fileId && sessionFiles.get(letter.fileId)
  if (file) return downloadBlob(file.name, file)
  downloadBlob(
    `${letter.ref.replace(/[^A-Za-z0-9-]+/g, '-')}.pdf`,
    textPdf([
      { text: letter.authority, size: 15, bold: true, gap: 2 },
      { text: 'Government of India / State Government', size: 10, gap: 18 },
      { text: `No. ${letter.ref}`, size: 10, gap: 2 },
      { text: `Dated: ${formatDate(letter.date)}`, size: 10, gap: 18 },
      { text: `To: ${lead.contactPerson}, ${lead.company}, ${lead.location ?? ''}`, gap: 14 },
      { text: `Subject: ${letter.title} - ${project.name}, ${project.site}`, bold: true, gap: 14 },
      { text: letter.body ?? `With reference to the application submitted for ${project.name}, this office conveys the ${letter.title.toLowerCase()}. The conditions of the approval shall be complied with as per the applicable rules.`, gap: 24 },
      { text: 'Issued by the competent authority.', gap: 30 },
      { text: `Shared with the client through the ${companyName} client portal. Demo document.`, size: 9 },
    ]),
  )
}
