import { Plus, Trash2, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { useCrm, useMoney } from '../../context/crm'
import { TODAY } from '../../data/mockData'
import { toISODate } from '../../utils/date'
import { quoteFor, quoteTotals } from '../../utils/workflow'

const blankItem = () => ({ description: '', qty: 1, rate: '' })

/*
 * Build or revise a quotation. New quotations start from the lead's service; revisions start from
 * the current quotation with the version bumped. Saving sends it (the lead moves to Proposal Sent).
 */
export function QuotationBuilder({ leadId, onClose, onSaved }) {
  const money = useMoney()
  const { leads, settings, saveQuotation } = useCrm()
  const titleId = useId()
  const openLeads = leads.filter((l) => l.stage !== 'Won' && l.stage !== 'Lost')
  const [selectedId, setSelectedId] = useState(leadId ?? '')
  const lead = leads.find((l) => l.id === selectedId)
  const current = lead ? quoteFor(lead, settings) : null

  const initial = (l, q) => ({
    items: q ? q.items.map((i) => ({ ...i })) : [{ description: l?.serviceDetail ?? '', qty: 1, rate: '' }, blankItem()],
    discountPct: q?.discountPct ?? 0,
    validDays: q?.validDays ?? settings.quoteValidityDays,
  })
  const [form, setForm] = useState(() => initial(lead, current))
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const items = form.items.map((i) => ({ ...i, qty: Number(i.qty) || 0, rate: Number(i.rate) || 0 }))
  const totals = quoteTotals({ items, discountPct: Number(form.discountPct) || 0, gstPct: settings.gstPct })

  const setItem = (index, key, value) => {
    setForm({ ...form, items: form.items.map((item, i) => (i === index ? { ...item, [key]: key === 'description' ? value : value.replace(/[^\d]/g, '') } : item)) })
    setError('')
  }

  const pickLead = (id) => {
    setSelectedId(id)
    const l = leads.find((x) => x.id === id)
    setForm(initial(l, l ? quoteFor(l, settings) : null))
  }

  const submit = (e) => {
    e.preventDefault()
    const lines = items.filter((i) => i.description.trim() && i.rate > 0)
    if (!lead) return setError('Choose the enquiry this quotation is for')
    if (lines.length === 0) return setError('Add at least one line with a description and rate')
    const quote = {
      version: current ? current.version + 1 : 1,
      items: lines.map((i) => ({ ...i, description: i.description.trim() })),
      discountPct: Number(form.discountPct) || 0,
      gstPct: settings.gstPct,
      validDays: Number(form.validDays) || settings.quoteValidityDays,
      sentOn: toISODate(TODAY),
    }
    saveQuotation(lead.id, { ...quote, net: quoteTotals(quote).net })
    onSaved(lead.id)
  }

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="enquiry-drawer quote-builder" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="drawer-header">
          <h2 id={titleId}>{current ? `Revise ${current.number}` : 'New Quotation'}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </header>
        <form className="drawer-form" onSubmit={submit} noValidate>
          <div className="drawer-body">
            <label className="field builder-lead">
              <span className="field-label">
                Enquiry <em aria-hidden="true">*</em>
              </span>
              <select value={selectedId} onChange={(e) => pickLead(e.target.value)} disabled={Boolean(leadId)}>
                <option value="">Choose an open enquiry…</option>
                {openLeads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.id} — {l.company} ({l.serviceDetail})
                  </option>
                ))}
              </select>
            </label>

            <table className="line-items">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Rate (₹)</th>
                  <th className="num">Amount</th>
                  <th>
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input value={item.description} onChange={(e) => setItem(index, 'description', e.target.value)} placeholder="Service or deliverable" aria-label={`Line ${index + 1} description`} />
                    </td>
                    <td>
                      <input value={item.qty} onChange={(e) => setItem(index, 'qty', e.target.value)} inputMode="numeric" className="qty" aria-label={`Line ${index + 1} quantity`} />
                    </td>
                    <td>
                      <input value={item.rate} onChange={(e) => setItem(index, 'rate', e.target.value)} inputMode="numeric" placeholder="0" aria-label={`Line ${index + 1} rate`} />
                    </td>
                    <td className="num">{money.short((Number(item.qty) || 0) * (Number(item.rate) || 0))}</td>
                    <td>
                      <button type="button" className="icon-button small" onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })} disabled={form.items.length === 1} aria-label={`Remove line ${index + 1}`}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="link-button" onClick={() => setForm({ ...form, items: [...form.items, blankItem()] })}>
              <Plus size={15} /> Add line
            </button>

            <div className="builder-bottom">
              <div className="form-grid">
                <label className="field">
                  <span className="field-label">Discount (%)</span>
                  <input value={form.discountPct} onChange={(e) => setForm({ ...form, discountPct: e.target.value.replace(/[^\d.]/g, '') })} inputMode="decimal" />
                </label>
                <label className="field">
                  <span className="field-label">Valid for (days)</span>
                  <input value={form.validDays} onChange={(e) => setForm({ ...form, validDays: e.target.value.replace(/[^\d]/g, '') })} inputMode="numeric" />
                </label>
              </div>
              <dl className="totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{money.short(totals.gross)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div>
                    <dt>Discount</dt>
                    <dd>− {money.short(totals.discount)}</dd>
                  </div>
                )}
                <div>
                  <dt>GST {settings.gstPct}%</dt>
                  <dd>{money.short(totals.gst)}</dd>
                </div>
                <div className="grand">
                  <dt>Total</dt>
                  <dd>{money.full(totals.total)}</dd>
                </div>
              </dl>
            </div>
            {error && <p className="field-error">{error}</p>}
          </div>
          <footer className="drawer-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {current ? 'Send Revision' : 'Send Quotation'}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  )
}
