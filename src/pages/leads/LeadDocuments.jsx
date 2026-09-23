import { Download, File, FileImage, FileSpreadsheet, FileText, Tag, Trash2, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useAccess, useCrm } from '../../context/crm'
import { formatDayMonth } from '../../utils/date'
import { downloadDocument } from '../../utils/files'

const MAX_SIZE = 10 * 1024 * 1024
const SUGGESTED_TAGS = ['High value', 'Repeat client', 'Govt. deadline', 'Site visit done', 'Urgent']

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

function iconFor(doc) {
  if (doc.type.startsWith('image/')) return FileImage
  if (/sheet|excel|csv/.test(doc.type) || /\.(xlsx?|csv)$/i.test(doc.name)) return FileSpreadsheet
  if (/pdf|word|document|text/.test(doc.type) || /\.(pdf|docx?)$/i.test(doc.name)) return FileText
  return File
}

function Tags({ lead }) {
  const { setTags } = useCrm()
  const { may } = useAccess()
  const [draft, setDraft] = useState('')
  const tags = lead.tags ?? []

  const add = (value) => {
    const tag = value.trim()
    if (tag && !tags.some((t) => t.toLowerCase() === tag.toLowerCase())) setTags(lead.id, [...tags, tag])
    setDraft('')
  }

  return (
    <section className="tags-section">
      <h3>
        <Tag size={16} /> Tags
      </h3>
      <div className="tag-list">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
            {may('contact') && (
              <button onClick={() => setTags(lead.id, tags.filter((t) => t !== tag))} aria-label={`Remove tag ${tag}`}>
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {may('contact') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            add(draft)
          }}
        >
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a tag and press Enter" aria-label="Add a tag" />
        </form>
        )}
        {tags.length === 0 && !may('contact') && <span className="muted small">No tags</span>}
      </div>
      {may('contact') && (
      <div className="tag-suggestions">
        {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
          <button key={tag} onClick={() => add(tag)}>
            + {tag}
          </button>
        ))}
      </div>
      )}
    </section>
  )
}

/* Documents shared by the client (lease papers, maps, reports). The demo keeps only file details, not contents. */
export function LeadDocuments({ lead }) {
  const { addDocuments, removeDocument, settings } = useCrm()
  const canEdit = useAccess().may('contact')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const documents = lead.documents ?? []

  const accept = (fileList) => {
    const files = [...fileList]
    const tooBig = files.filter((f) => f.size > MAX_SIZE)
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(', ')} ${tooBig.length === 1 ? 'is' : 'are'} over 10 MB and ${tooBig.length === 1 ? 'was' : 'were'} skipped.` : '')
    addDocuments(
      lead.id,
      files.filter((f) => f.size <= MAX_SIZE),
    )
  }

  return (
    <div className="documents">
      {canEdit && (
      <div
        className={`dropzone ${dragOver ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          accept(e.dataTransfer.files)
        }}
      >
        <UploadCloud size={26} strokeWidth={1.6} />
        <p>
          Drag files here or{' '}
          <button className="link-button" onClick={() => inputRef.current?.click()}>
            browse
          </button>
        </p>
        <span className="muted">Lease deeds, maps, survey reports — PDF, Word, Excel or images, up to 10 MB each</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            accept(e.target.files)
            e.target.value = ''
          }}
        />
      </div>
      )}
      {error && <p className="field-error">{error}</p>}

      {documents.length > 0 ? (
        <ul className="doc-list">
          {documents.map((doc) => {
            const Icon = iconFor(doc)
            return (
              <li key={doc.id}>
                <span className="doc-icon">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{doc.name}</strong>
                  <span className="muted">
                    {formatSize(doc.size)} · added {formatDayMonth(doc.addedOn)}
                    {doc.byClient && ' · from client portal'}
                  </span>
                </div>
                <button className="icon-button small" onClick={() => downloadDocument(doc, { company: lead.company, companyName: settings.companyName })} aria-label={`Download ${doc.name}`}>
                  <Download size={15} />
                </button>
                {canEdit && (
                  <button className="icon-button small" onClick={() => removeDocument(lead.id, doc.id)} aria-label={`Remove ${doc.name}`}>
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="muted small">No documents yet.</p>
      )}

      <Tags lead={lead} />
    </div>
  )
}
