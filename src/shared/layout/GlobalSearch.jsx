import { Briefcase, CalendarCheck, Clock, Contact, LayoutDashboard, Search, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccess } from '../../core/permissions/crm'
import { storage } from '@/core/storage/storage'
import { NAV_ITEMS } from './navigation'

const LIMIT = 5

/* Searches employees, designations, departments and HRMS pages. */
export function GlobalSearch() {
  const navigate = useNavigate()
  const { can } = useAccess()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [mobileActive, setMobileActive] = useState(false)
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
  const employees = storage.getEmployees?.() || []

  const empMatches = (emp) =>
    emp &&
    [
      emp.name,
      emp.employeeId,
      emp.id,
      emp.employment?.designation,
      emp.employment?.department,
      emp.contact?.workEmail,
      emp.contact?.phone,
    ].some((v) => v && String(v).toLowerCase().includes(q))

  const pageMatches = (item) => item.label.toLowerCase().includes(q)

  const groups =
    q.length < 2
      ? []
      : [
          {
            label: 'Employees',
            icon: Users,
            items: employees
              .filter(empMatches)
              .slice(0, LIMIT)
              .map((emp) => ({
                key: `emp-${emp.id}`,
                title: emp.name,
                sub: `${emp.employeeId || emp.id} · ${emp.employment?.designation || ''} · ${emp.employment?.department || ''}`,
                to: can('/hr/employees') ? `/hr/employees/${emp.id}` : '/hr/team',
              })),
          },
          {
            label: 'Quick Navigation',
            icon: LayoutDashboard,
            items: NAV_ITEMS.filter(pageMatches)
              .slice(0, LIMIT)
              .map((item) => ({
                key: `nav-${item.path}`,
                title: item.label,
                sub: item.path,
                to: item.path,
              })),
          },
        ]
          .map((g) => ({ ...g, items: g.items.filter((item) => can(item.to)) }))
          .filter((g) => g.items.length)

  const flat = groups.flatMap((g) => g.items)
  const pick = (item) => {
    navigate(item.to)
    setQuery('')
    setOpen(false)
    setMobileActive(false)
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
      setMobileActive(false)
      inputRef.current?.blur()
    }
  }

  let index = -1
  return (
    <div className={`global-search ${mobileActive ? 'is-mobile-open' : ''}`} ref={wrapRef}>
      {/* Mobile search trigger button */}
      <button
        type="button"
        className="icon-button mobile-search-trigger"
        onClick={() => {
          setMobileActive(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        aria-label="Search"
      >
        <Search size={19} />
      </button>

      {/* Main search bar */}
      <div className={`search-container ${mobileActive ? 'is-mobile-expanded' : ''}`}>
        <label className="search">
          <Search size={16} className="muted" />
          <span className="sr-only">Search</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder="Search employees, departments, attendance..."
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
          {mobileActive && (
            <button
              type="button"
              className="search-mobile-close"
              onClick={() => {
                setMobileActive(false)
                setOpen(false)
                setQuery('')
              }}
              aria-label="Close search"
            >
              <X size={17} />
            </button>
          )}
        </label>
      </div>

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
