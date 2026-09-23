import { Check, Download, FileText, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { TODAY } from '../../data/mockData'
import { TDS_SECTIONS } from '../../data/vendors'
import { formatNearDate, toISODate } from '../../utils/date'
import { downloadDocument } from '../../utils/files'

const todayISO = toISODate(TODAY)
const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`
const GST = 0.18

function FilePick({ files, onChange, multiple = true, label = 'Attach files' }) {
  const input = useRef(null)
  return (
    <div className="wo-files">
      <button type="button" className="btn btn-small" onClick={() => input.current.click()}>
        <UploadCloud size={14} /> {label}
      </button>
      <input
        ref={input}
        type="file"
        hidden
        multiple={multiple}
        accept=".pdf,.xls,.xlsx,.csv,.zip,.kml,.kmz,image/*"
        onChange={(e) => {
          onChange(multiple ? [...files, ...e.target.files] : [...e.target.files].slice(0, 1))
          e.target.value = ''
        }}
      />
      {files.map((f) => (
        <span key={`${f.name}-${f.size}`} className="wo-file-chip">
          <FileText size={13} /> {f.name}
          <button type="button" onClick={() => onChange(files.filter((x) => x !== f))} aria-label={`Remove ${f.name}`}>
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  )
}

/*
 * The form for the next step on a subcontract. step: 'deliver' | 'bill' | 'check' | 'pay'.
 * onSubmit(details) gets what recordWorkStep needs.
 */
export function WorkStepForm({ order, step, vendor, onSubmit, onCancel, forVendor = false }) {
  const [on, setOn] = useState(todayISO)
  const [note, setNote] = useState('')
  const [files, setFiles] = useState([])
  const [billNo, setBillNo] = useState('')
  const [amount, setAmount] = useState(String(order.amount))
  const [tdsKey, setTdsKey] = useState(() => {
    const i = TDS_SECTIONS.findIndex((t) => t.section === vendor?.tds?.section && t.rate === vendor?.tds?.rate)
    return String(i === -1 ? 1 : i)
  })
  const [payRef, setPayRef] = useState('')

  if (step === 'deliver') {
    return (
      <form
        className="wo-form-step"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ on, note: note.trim(), files })
        }}
      >
        <label className="field">
          <span className="field-label">Delivered on</span>
          <input type="date" value={on} max={todayISO} min={order.issuedOn} onChange={(e) => setOn(e.target.value)} required />
        </label>
        <label className="field field-wide">
          <span className="field-label">What was delivered</span>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Report, drill logs, lab results, drone data…" required />
        </label>
        <FilePick files={files} onChange={setFiles} label={forVendor ? 'Upload report / data' : 'Attach report / data'} />
        <div className="letter-form-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!note.trim()}>
            {forVendor ? 'Submit delivery' : 'Record delivery'}
          </button>
        </div>
      </form>
    )
  }

  if (step === 'bill') {
    const value = Number(amount) || 0
    return (
      <form
        className="wo-form-step"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ no: billNo.trim(), date: on, amount: value, file: files[0] ?? null })
        }}
      >
        <label className="field">
          <span className="field-label">Bill / invoice no.</span>
          <input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="e.g. INV/2026/142" required />
        </label>
        <label className="field">
          <span className="field-label">Bill date</span>
          <input type="date" value={on} max={todayISO} onChange={(e) => setOn(e.target.value)} required />
        </label>
        <label className="field">
          <span className="field-label">Amount before GST (₹)</span>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        {value > 0 && value !== order.amount && (
          <p className="wo-diff field-wide">
            {value > order.amount ? `${rupees(value - order.amount)} more` : `${rupees(order.amount - value)} less`} than the work order ({rupees(order.amount)}). Accounts will check the difference.
          </p>
        )}
        <FilePick files={files} onChange={setFiles} multiple={false} label={forVendor ? 'Attach the bill (needed to submit)' : 'Attach the bill'} />
        <div className="letter-form-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!billNo.trim() || !(value > 0) || (forVendor && files.length === 0)}>
            {forVendor ? 'Submit bill' : 'Record bill'}
          </button>
        </div>
      </form>
    )
  }

  if (step === 'check') {
    const m = order.match
    const rows = [
      ['Work order', `${order.id} · ${rupees(order.amount)}`, true],
      ['Delivery', order.delivery ? `Recorded ${formatNearDate(order.delivery.on)}${order.delivery.files?.length ? ` · ${order.delivery.files.length} file(s)` : ''}` : 'Not recorded', m.delivery],
      ['Bill', `${order.bill.no} · ${rupees(order.bill.amount)}${m.diff ? ` (${m.diff > 0 ? '+' : '−'}${rupees(Math.abs(m.diff))})` : ''}`, m.amount],
    ]
    const clean = m.delivery && m.amount
    return (
      <form
        className="wo-form-step"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ ok: true, note: note.trim() })
        }}
      >
        <table className="wo-match field-wide">
          <tbody>
            {rows.map(([label, value, ok]) => (
              <tr key={label} className={ok ? 'is-ok' : 'is-off'}>
                <th>{label}</th>
                <td>{value}</td>
                <td>{ok ? <Check size={15} /> : <X size={15} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <label className="field field-wide">
          <span className="field-label">{clean ? 'Note (optional)' : 'Why it can still be paid, or why it goes back'}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={clean ? 'e.g. Checked with the site report' : 'e.g. Extra hole drilled on site, approved by the team lead'} />
        </label>
        <div className="letter-form-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn" onClick={() => onSubmit({ ok: false, note: note.trim() || (m.amount ? 'Does not match the delivery' : 'Amount does not match the work order') })}>
            Return to vendor
          </button>
          <button type="submit" className="btn btn-primary" disabled={!m.delivery || (!clean && !note.trim())}>
            Approve for payment
          </button>
        </div>
      </form>
    )
  }

  if (step === 'pay') {
    const tds = TDS_SECTIONS[Number(tdsKey)]
    const base = order.bill.amount
    const gross = Math.round(base * (1 + GST))
    const tdsAmount = Math.round((base * tds.rate) / 100)
    return (
      <form
        className="wo-form-step"
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({ gross, tds: { section: tds.section, rate: tds.rate }, ref: payRef.trim() })
        }}
      >
        <label className="field field-wide">
          <span className="field-label">TDS</span>
          <select value={tdsKey} onChange={(e) => setTdsKey(e.target.value)}>
            {TDS_SECTIONS.map((t, i) => (
              <option key={t.label} value={i}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <dl className="wo-pay field-wide">
          <div>
            <dt>Bill, before GST</dt>
            <dd>{rupees(base)}</dd>
          </div>
          <div>
            <dt>GST 18%</dt>
            <dd>{rupees(gross - base)}</dd>
          </div>
          <div>
            <dt>
              TDS {tds.section} @ {tds.rate}%
            </dt>
            <dd>− {rupees(tdsAmount)}</dd>
          </div>
          <div className="wo-pay-net">
            <dt>To pay</dt>
            <dd>{rupees(gross - tdsAmount)}</dd>
          </div>
        </dl>
        <label className="field field-wide">
          <span className="field-label">Payment reference (UTR / cheque no.)</span>
          <input value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="e.g. NEFT UTIB2026092312" required />
        </label>
        <div className="letter-form-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!payRef.trim()}>
            Release payment
          </button>
        </div>
      </form>
    )
  }
  return null
}

function FileLinks({ files, company, companyName }) {
  if (!files?.length) return null
  return (
    <span className="wo-trail-files">
      {files.map((f) => (
        <button key={f.id} type="button" className="link-button" onClick={() => downloadDocument(f, { company, companyName })}>
          <Download size={12} /> {f.name}
        </button>
      ))}
    </span>
  )
}

/* The subcontract's record, step by step: who did what, when, with the files. money hides amounts for operations roles. */
export function WorkOrderTrail({ order, money, company, companyName }) {
  const full = money?.full ?? rupees
  const steps = [
    { key: 'issued', label: 'Work order issued', done: true, when: order.issuedOn, text: `${order.work} · ${full(order.amount)} before GST · due ${formatNearDate(order.dueOn)}` },
    { key: 'started', label: 'Work started', done: Boolean(order.startedOn), when: order.startedOn },
    {
      key: 'delivered',
      label: 'Delivered',
      done: Boolean(order.delivery),
      when: order.delivery?.on,
      text: order.delivery && `${order.delivery.note ?? ''}${order.delivery.by ? ` — ${order.delivery.by}` : ''}`,
      files: order.delivery?.files,
      flag: order.delivery && order.delayDays > 0 ? `${order.delayDays} day${order.delayDays === 1 ? '' : 's'} late` : null,
    },
    ...(order.returned ?? []).map((b, i) => ({ key: `returned-${i}`, label: `Bill ${b.no} returned`, done: true, when: b.returnedOn, text: `${full(b.amount)} · ${b.reason}${b.by ? ` — ${b.by}` : ''}`, flag: 'Returned' })),
    { key: 'bill', label: 'Bill received', done: Boolean(order.bill), when: order.bill?.date, text: order.bill && `${order.bill.no} · ${full(order.bill.amount)} before GST`, files: order.bill?.file ? [order.bill.file] : null, flag: order.bill && !money?.hidden && order.match && !order.match.amount ? 'Differs from the order' : null },
    { key: 'check', label: 'Checked by Accounts', done: Boolean(order.check?.ok), when: order.check?.on, text: order.check?.ok && `Order, delivery and bill match${order.check.note ? ` — ${order.check.note}` : ''} · ${order.check.by}` },
    {
      key: 'paid',
      label: 'Payment released',
      done: Boolean(order.payment),
      when: order.payment?.on,
      text: order.payment && (money?.hidden ? `Ref. ${order.payment.ref}` : `${rupees(order.payment.gross - order.payment.tds.amount)} paid · TDS ${order.payment.tds.section} ${rupees(order.payment.tds.amount)} · ref. ${order.payment.ref} · ${order.payment.by}`),
    },
  ]
  return (
    <ol className="wo-trail">
      {steps.map((s) => (
        <li key={s.key} className={s.done ? 'is-done' : ''}>
          <span className="wo-trail-dot">{s.done && <Check size={11} strokeWidth={3} />}</span>
          <div>
            <strong>
              {s.label}
              {s.flag && <span className="pill status-pill tone-urgent">{s.flag}</span>}
            </strong>
            {s.done && s.when && <span className="muted">{formatNearDate(s.when)}</span>}
            {s.text && <p>{s.text}</p>}
            <FileLinks files={s.files} company={company} companyName={companyName} />
          </div>
        </li>
      ))}
    </ol>
  )
}
