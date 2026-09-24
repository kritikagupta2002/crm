import { Download, FileInput, FileScan, Upload, X } from 'lucide-react'
import { useRef } from 'react'
import { useCrm } from '../../context/crm'
import { SCAN_FOLDER } from '../../data/scans'
import { formatNearDate } from '../../utils/date'
import { downloadDocument } from '../../utils/files'

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)
const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

/*
 * Scans waiting in the NAS scanner folder (flowchart 3, steps 1–2). Filing one opens the letter form with the scan
 * as its copy; canFile: the Coordinator or the Admin (the approval stage's owners).
 */
export function ScanInbox({ canFile, onFile }) {
  const { scanInbox, addScans, discardScan, settings } = useCrm()
  const input = useRef(null)

  return (
    <div className="scan-inbox">
      <div className="scan-inbox-head">
        <span className="muted small">
          Scanner folder <span className="mono-sub">{SCAN_FOLDER}</span>
        </span>
        {canFile && (
          <>
            <button className="btn btn-small" onClick={() => input.current.click()}>
              <Upload size={14} /> Add a scan
            </button>
            <input
              ref={input}
              type="file"
              accept=".pdf,image/*"
              multiple
              hidden
              onChange={(e) => {
                addScans([...e.target.files])
                e.target.value = ''
              }}
            />
          </>
        )}
      </div>

      {scanInbox.length === 0 ? (
        <p className="empty-state">Every scan has been filed. New letters from the scanner show up here.</p>
      ) : (
        <ul className="scan-list">
          {scanInbox.map((scan) => (
            <li key={scan.id}>
              <span className="scan-icon">
                <FileScan size={18} />
              </span>
              <div>
                <strong>{scan.name}</strong>
                <span className="muted">
                  {scan.scanner === 'Uploaded' ? 'Uploaded' : 'Scanned'} {formatNearDate(scan.scannedAt.slice(0, 10))}, {timeOf(scan.scannedAt)}
                  {scan.pages ? ` · ${scan.pages} page${scan.pages === 1 ? '' : 's'}` : ''} · {formatSize(scan.size)}
                </span>
              </div>
              <span className="scan-actions">
                <button className="icon-button small" onClick={() => downloadDocument({ ...scan, addedOn: scan.scannedAt.slice(0, 10) }, { company: 'Scanner folder', companyName: settings.companyName })} aria-label={`Open ${scan.name}`} title="Open the scan">
                  <Download size={15} />
                </button>
                {canFile && (
                  <>
                    <button className="btn btn-small" onClick={() => discardScan(scan.id)} title="Not a government letter: take it out of the inbox">
                      <X size={14} /> Not a letter
                    </button>
                    <button className="btn btn-primary btn-small" onClick={() => onFile(scan)}>
                      <FileInput size={14} /> File to project
                    </button>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
