import { Building2, FileText, Search, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StagePill } from '../common/StagePill'
import { useAccess, useCrm } from '../../context/crm'
import { quoteFor } from '../../utils/workflow'

const LIMIT = 5

/* Searches enquiries, clients and quotations; arrow keys + Enter to pick, "/" anywhere to focus. */
export function GlobalSearch() {
  const { leads } = useCrm()
  const navigate = useNavigate()
  const { can } = useAccess()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    const onDown = (e) => !wrapRef.current?.contains(e.target) && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [])

  const q = query.trim().toLowerCase()
  const digits = q.replace(/\D/g, '')
  const matches = (lead) =>
    [lead.id, lead.company, lead.contactPerson, lead.email, lead.location].some((v) => v?.toLowerCase().includes(q)) || (digits.length >= 4 && lead.phone?.includes(digits))

  const groups = q.length < 2 ? [] : [
    {
      label: 'Enquiries',
      icon: Users,
      items: leads.filter((l) => l.stage !== 'Won' && matches(l)).slice(0, LIMIT).map((l) => ({ key: l.id, title: l.company, sub: `${l.id} · ${l.serviceDetail}`, stage: l.stage, to: `/leads/${l.id}` })),
    },
    {
      label: 'Clients',
      icon: Building2,
      items: leads.filter((l) => l.stage === 'Won' && matches(l)).slice(0, LIMIT).map((l) => ({ key: `c-${l.id}`, title: l.company, sub: `${l.contactPerson} · ${l.location ?? ''}`, to: `/leads/${l.id}` })),
    },
    {
      label: 'Quotations',
      icon: FileText,
      items: leads
        .map((l) => ({ lead: l, quote: quoteFor(l) }))
        .filter(({ lead, quote }) => quote && (quote.number.toLowerCase().includes(q) || lead.company.toLowerCase().includes(q)))
        .slice(0, LIMIT)
        .map(({ lead, quote }) => ({ key: `q-${lead.id}`, title: quote.number, sub: `${lead.company} · ${quote.displayStatus}`, to: `/quotations?open=${lead.id}` })),
    },
  ]
    .map((g) => ({ ...g, items: g.items.filter((item) => can(item.to)) }))
    .filter((g) => g.items.length)

  const flat = groups.flatMap((g) => g.items)
  const pick = (item) => {
    navigate(item.to)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && flat[active]) {
      pick(flat[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  let index = -1
  return (
    <div className="global-search" ref={wrapRef}>
      <label className="search">
        <Search size={16} className="muted" />
        <span className="sr-only">Search</span>
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder="Search clients, enquiries, quotations"
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && q.length >= 2}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
        <kbd>/</kbd>
      </label>

      {open && q.length >= 2 && (
        <div className="search-results" id="search-results" role="listbox">
          {groups.length === 0 && <p className="search-empty">No matches for “{query.trim()}”</p>}
          {groups.map((group) => (
            <div key={group.label} className="search-group">
              <p className="search-group-title">
                <group.icon size={14} /> {group.label}
              </p>
              {group.items.map((item) => {
                index += 1
                const i = index
                return (
                  <button
                    key={item.key}
                    role="option"
                    aria-selected={i === active}
                    className={`search-item ${i === active ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(item)}
                  >
                    <span>
                      <strong>{item.title}</strong>
                      <span className="muted">{item.sub}</span>
                    </span>
                    {item.stage && <StagePill stage={item.stage} />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
