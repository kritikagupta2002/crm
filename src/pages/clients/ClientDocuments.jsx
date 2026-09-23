import { Download, FileText, ScrollText, UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAccess, useCrm } from '../../context/crm'
import { formatNearDate } from '../../utils/date'
import { downloadDocument, downloadLetter } from '../../utils/files'
import { clientProjects } from '../../utils/projects'

const MAX_SIZE = 10 * 1024 * 1024
const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

/* The client's document vault: files shared either way, and every government letter across their projects. */
export function ClientDocuments({ client }) {
  const { addDocuments, projectEdits, settings } = useCrm()
  const canShare = useAccess().may('contact')
  const input = useRef(null)
  const [error, setError] = useState('')
  const docs = client.documents ?? []
  const letters = clientProjects(client, projectEdits).flatMap((project) => project.letters.map((letter) => ({ letter, project })))

  const upload = (fileList) => {
    const files = [...fileList]
    const tooBig = files.filter((f) => f.size > MAX_SIZE)
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} is over 10 MB and was skipped.` : '')
    addDocuments(
      client.id,
      files.filter((f) => f.size <= MAX_SIZE),
    )
  }

  return (
    <section className="lead-section vault">
      <div className="vault-head">
        <h3>Documents &amp; letters</h3>
        {canShare && (
          <button className="btn btn-small" onClick={() => input.current.click()}>
            <UploadCloud size={14} /> Upload
          </button>
        )}
        <input
          ref={input}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            upload(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <h4>
        Files <span className="muted">{docs.length}</span>
      </h4>
      {docs.length === 0 ? (
        <p className="muted small">No files yet. Lease papers, maps and the work order go here; the client can also upload from their portal.</p>
      ) : (
        <ul className="letter-list">
          {docs.map((doc) => (
            <li key={doc.id}>
              <FileText size={16} />
              <span>
                <strong>{doc.name}</strong>
                <span className="muted">
                  {doc.byClient ? 'From client portal' : 'Shared by team'} · {formatNearDate(doc.addedOn)} · {formatSize(doc.size)}
                </span>
              </span>
              <button className="icon-button small" onClick={() => downloadDocument(doc, { company: client.company, companyName: settings.companyName })} aria-label={`Download ${doc.name}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <h4>
        Government letters <span className="muted">{letters.length}</span>
      </h4>
      {letters.length === 0 ? (
        <p className="muted small">None yet. Letters added under a project appear here and in the client portal.</p>
      ) : (
        <ul className="letter-list">
          {letters.map(({ letter, project }) => (
            <li key={letter.id}>
              <ScrollText size={16} />
              <span>
                <strong>{letter.title}</strong>
                <span className="muted">
                  {project.name} · {letter.ref} · {formatNearDate(letter.date)}
                </span>
              </span>
              <button className="icon-button small" onClick={() => downloadLetter(letter, { project, lead: client, companyName: settings.companyName })} aria-label={`Download ${letter.title}`}>
                <Download size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="field-error">{error}</p>}
    </section>
  )
}
