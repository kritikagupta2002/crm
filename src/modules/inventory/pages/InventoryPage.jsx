import { useState, useMemo } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Truck,
  User,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react'
import { KpiCard } from '../../../shared/components/KpiCard'
import { useAccess, useCrm } from '../../../core/permissions/crm'
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STATUSES,
} from '../data/inventory'
import { allProjects } from '../../erm/utils/projects'
import { storage } from '../../../hrms/core/storage/storage'
import { AddInventoryModal } from '../components/AddInventoryModal'
import { AssignInventoryModal } from '../components/AssignInventoryModal'
import { ReturnInventoryModal } from '../components/ReturnInventoryModal'
import { InventoryDetailModal } from '../components/InventoryDetailModal'
import './inventory.css'

export function InventoryPage() {
  const {
    inventory = [],
    inventoryAssignments = [],
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    assignInventory,
    returnInventory,
    leads = [],
    projectEdits = {},
  } = useCrm()

  const { role, may } = useAccess()
  const canManage = may('inventory')

  // UI state
  const [tab, setTab] = useState('stock') // 'stock' | 'active' | 'history'
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [assigningItem, setAssigningItem] = useState(null)
  const [returningAssignment, setReturningAssignment] = useState(null)
  const [viewingItem, setViewingItem] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // Toast feedback state
  const [toast, setToast] = useState(null)
  const showToast = (message, isError = false) => {
    setToast({ message, isError })
    setTimeout(() => setToast(null), 4000)
  }

  // Projects list for project assignments
  const projects = useMemo(() => allProjects(leads, projectEdits) || [], [leads, projectEdits])

  // Employees master list for employee filtering
  const employees = useMemo(() => {
    try {
      return storage.getEmployees() || []
    } catch {
      return []
    }
  }, [])

  // KPI Calculations from actual inventory and assignments data
  const stats = useMemo(() => {
    const totalItemsCount = inventory.length
    const totalUnits = inventory.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

    const availableItemsCount = inventory.filter((item) => (item.availableQuantity || 0) > 0).length
    const availableUnits = inventory.reduce((sum, item) => sum + (Number(item.availableQuantity) || 0), 0)

    const activeAssignments = inventoryAssignments.filter((a) => a.status === 'Assigned')
    const assignedUnits = activeAssignments.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0)

    const returnedAssignments = inventoryAssignments.filter((a) => a.status === 'Returned')
    const returnedUnits = returnedAssignments.reduce((sum, a) => sum + (Number(a.quantity) || 0), 0)

    const lowStockItemsCount = inventory.filter(
      (item) => (item.availableQuantity || 0) <= 2,
    ).length

    return {
      totalItemsCount,
      totalUnits,
      availableItemsCount,
      availableUnits,
      activeAssignmentsCount: activeAssignments.length,
      assignedUnits,
      returnedAssignmentsCount: returnedAssignments.length,
      returnedUnits,
      lowStockItemsCount,
    }
  }, [inventory, inventoryAssignments])

  // Filtered Stock Inventory items
  const filteredInventory = useMemo(() => {
    const q = search.trim().toLowerCase()

    return inventory.filter((item) => {
      // Search query filter
      if (q) {
        const matchesQuery = [
          item.name,
          item.assetId,
          item.id,
          item.category,
          item.location,
          item.description,
          item.vendor,
        ].some((v) => v?.toLowerCase().includes(q))
        if (!matchesQuery) return false
      }

      // Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false
      }

      // Status filter
      if (selectedStatus && item.status !== selectedStatus) {
        return false
      }

      // Employee filter: if an employee is selected, check if this item is currently assigned to them
      if (selectedEmployeeFilter) {
        const hasAssignmentToEmp = inventoryAssignments.some(
          (a) =>
            a.status === 'Assigned' &&
            (a.inventoryItemId === item.id || a.assetId === item.assetId) &&
            (a.employeeId === selectedEmployeeFilter || a.employeeName === selectedEmployeeFilter),
        )
        if (!hasAssignmentToEmp) return false
      }

      return true
    })
  }, [inventory, inventoryAssignments, search, selectedCategory, selectedStatus, selectedEmployeeFilter])

  // Filtered Active Assignments
  const filteredActiveAssignments = useMemo(() => {
    const q = search.trim().toLowerCase()
    const active = inventoryAssignments.filter((a) => a.status === 'Assigned')

    return active.filter((a) => {
      if (q) {
        const matches = [
          a.itemName,
          a.assetId,
          a.employeeName,
          a.employeeId,
          a.projectName,
          a.category,
        ].some((v) => v?.toLowerCase().includes(q))
        if (!matches) return false
      }

      if (selectedCategory && a.category !== selectedCategory) return false

      if (selectedEmployeeFilter) {
        if (a.employeeId !== selectedEmployeeFilter && a.employeeName !== selectedEmployeeFilter) {
          return false
        }
      }

      return true
    })
  }, [inventoryAssignments, search, selectedCategory, selectedEmployeeFilter])

  // Filtered Assignment History
  const filteredHistory = useMemo(() => {
    const q = search.trim().toLowerCase()

    return inventoryAssignments.filter((a) => {
      if (q) {
        const matches = [
          a.itemName,
          a.assetId,
          a.employeeName,
          a.employeeId,
          a.projectName,
          a.status,
          a.remarks,
          a.returnRemarks,
        ].some((v) => v?.toLowerCase().includes(q))
        if (!matches) return false
      }

      if (selectedCategory && a.category !== selectedCategory) return false
      if (selectedStatus && a.status !== selectedStatus) return false

      if (selectedEmployeeFilter) {
        if (a.employeeId !== selectedEmployeeFilter && a.employeeName !== selectedEmployeeFilter) {
          return false
        }
      }

      return true
    })
  }, [inventoryAssignments, search, selectedCategory, selectedStatus, selectedEmployeeFilter])

  // Reset filters handler
  const handleResetFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedStatus('')
    setSelectedEmployeeFilter('')
  }

  const hasActiveFilters = Boolean(
    search || selectedCategory || selectedStatus || selectedEmployeeFilter,
  )

  // Actions
  const handleSaveItem = (itemData) => {
    try {
      createInventoryItem(itemData)
      setShowAddModal(false)
      showToast('Inventory item added successfully.')
    } catch (err) {
      showToast(err.message || 'Failed to add inventory item.', true)
      throw err
    }
  }

  const handleConfirmAssign = (assignmentData) => {
    try {
      assignInventory(assignmentData)
      setAssigningItem(null)
      showToast('Inventory assigned successfully.')
    } catch (err) {
      showToast(err.message || 'Failed to assign inventory.', true)
      throw err
    }
  }

  const handleConfirmReturn = (assignmentId, returnData) => {
    try {
      returnInventory(assignmentId, returnData)
      setReturningAssignment(null)
      showToast('Inventory returned successfully.')
    } catch (err) {
      showToast(err.message || 'Failed to return inventory.', true)
      throw err
    }
  }

  const handleDeleteItem = (itemId) => {
    try {
      deleteInventoryItem(itemId)
      setConfirmDeleteId(null)
      showToast('Inventory item deleted.')
    } catch (err) {
      showToast(err.message || 'Failed to delete item.', true)
    }
  }

  return (
    <div className="module-page inventory-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`inv-toast-float ${toast.isError ? 'error' : 'success'}`} role="alert">
          {toast.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="page-header">
        <div className="page-title">
          <h1>Inventory / Stock</h1>
          <p>Tools, machinery, survey instruments, materials and equipment stock</p>
        </div>

        {canManage && (
          <div className="page-actions">
            <button
              id="btn-add-inventory-item"
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              aria-label="Add new inventory item"
            >
              <Plus size={16} /> Add Inventory Item
            </button>
          </div>
        )}
      </header>

      {/* Summary KPI Cards */}
      <section className="stat-grid inventory-stats" aria-label="Inventory Stock Metrics">
        <KpiCard
          tone="tone-info"
          icon={Boxes}
          label="Total Items"
          value={stats.totalItemsCount}
        >
          <span className="muted">{stats.totalUnits} total units in catalog</span>
        </KpiCard>

        <KpiCard
          tone="tone-good"
          icon={PackageCheck}
          label="Available"
          value={stats.availableItemsCount}
        >
          <span className="muted">{stats.availableUnits} units available to assign</span>
        </KpiCard>

        <KpiCard
          tone="tone-attention"
          icon={UserCheck}
          label="Assigned"
          value={stats.activeAssignmentsCount}
        >
          <span className="muted">{stats.assignedUnits} units checked out in field</span>
        </KpiCard>

        <KpiCard
          tone="tone-neutral"
          icon={RotateCcw}
          label="Returned"
          value={stats.returnedAssignmentsCount}
        >
          <span className="muted">{stats.returnedUnits} units returned to stock</span>
        </KpiCard>

        <KpiCard
          tone={stats.lowStockItemsCount > 0 ? 'tone-urgent' : 'tone-good'}
          icon={AlertTriangle}
          label="Low Stock"
          value={stats.lowStockItemsCount}
        >
          <span className="muted">
            {stats.lowStockItemsCount > 0 ? 'Items with ≤ 2 available' : 'All items adequately stocked'}
          </span>
        </KpiCard>
      </section>

      {/* Main Container Card */}
      <section className="card">
        {/* Navigation Tabs */}
        <nav className="stage-tabs" aria-label="Inventory views">
          <button
            type="button"
            className={`stage-tab ${tab === 'stock' ? 'is-active' : ''}`}
            onClick={() => setTab('stock')}
            aria-pressed={tab === 'stock'}
          >
            <Boxes size={14} className="inline mr-1.5" />
            Stock Inventory
            <span>{inventory.length}</span>
          </button>

          <button
            type="button"
            className={`stage-tab ${tab === 'active' ? 'is-active' : ''}`}
            onClick={() => setTab('active')}
            aria-pressed={tab === 'active'}
          >
            <UserCheck size={14} className="inline mr-1.5" />
            Active Assignments
            <span>{stats.activeAssignmentsCount}</span>
          </button>

          <button
            type="button"
            className={`stage-tab ${tab === 'history' ? 'is-active' : ''}`}
            onClick={() => setTab('history')}
            aria-pressed={tab === 'history'}
          >
            <Clock size={14} className="inline mr-1.5" />
            Assignment History
            <span>{inventoryAssignments.length}</span>
          </button>
        </nav>

        {/* Search & Filters Toolbar */}
        <div className="inventory-toolbar">
          <label className="inventory-search">
            <Search size={16} className="text-slate-400" />
            <input
              id="inventory-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, asset ID, model, location..."
              aria-label="Search inventory"
            />
            {search && (
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </label>

          <div className="inventory-filter-group">
            {/* Category Filter */}
            <select
              id="filter-category"
              className="inventory-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All Categories</option>
              {INVENTORY_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            {tab !== 'active' && (
              <select
                id="filter-status"
                className="inventory-filter-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="">All Statuses</option>
                {INVENTORY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            )}

            {/* Employee Filter (Admin/Manager inspect items assigned to an employee) */}
            <select
              id="filter-employee"
              className="inventory-filter-select"
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              aria-label="Filter by assigned employee"
            >
              <option value="">Filter by Employee (All)</option>
              {employees.map((emp) => (
                <option key={emp.employeeId || emp.id} value={emp.employeeId || emp.name}>
                  {emp.name} ({emp.employeeId})
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleResetFilters}
              >
                <X size={13} /> Reset
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: Stock Inventory Table */}
        {tab === 'stock' && (
          <div className="table-wrap">
            {filteredInventory.length === 0 ? (
              <div className="inv-empty-state">
                <Boxes size={40} />
                <h3>No inventory items found.</h3>
                <p>
                  {hasActiveFilters
                    ? 'No stock matches your search filters. Try clearing or broadening your search criteria.'
                    : 'Get started by adding your first tools, instruments or machinery stock item.'}
                </p>
                {canManage && !hasActiveFilters && (
                  <button
                    type="button"
                    className="btn btn-primary mt-2"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus size={15} /> Add Inventory Item
                  </button>
                )}
              </div>
            ) : (
              <table className="leads-table" aria-label="Inventory Stock Table">
                <thead>
                  <tr>
                    <th>Item ID / Asset</th>
                    <th>Item Name & Description</th>
                    <th>Category</th>
                    <th style={{ minWidth: '130px' }}>Stock Level</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const available = item.availableQuantity !== undefined ? item.availableQuantity : item.quantity
                    const total = item.totalQuantity !== undefined ? item.totalQuantity : item.quantity
                    const pct = total > 0 ? Math.round((available / total) * 100) : 0
                    const barClass = pct > 50 ? 'good' : pct > 20 ? 'medium' : 'low'

                    return (
                      <tr key={item.id} className="lead-row">
                        <td>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {item.assetId || item.id}
                          </span>
                        </td>
                        <td>
                          <div className="font-semibold text-slate-900 line-clamp-1">{item.name}</div>
                          {item.description && (
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {item.description}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="cat-badge">{item.category}</span>
                        </td>
                        <td>
                          <div className="stock-bar-wrap">
                            <div className="stock-bar-nums">
                              <span className="font-bold text-slate-900">
                                {available} <span className="font-normal text-slate-500">/ {total}</span>
                              </span>
                              <span className="text-slate-500 text-[10px]">{item.unit || 'Nos'}</span>
                            </div>
                            <div className="stock-bar-track">
                              <div
                                className={`stock-bar-fill ${barClass}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`inv-badge ${
                              item.status === 'Available'
                                ? 'inv-badge-available'
                                : item.status === 'Partially Assigned'
                                  ? 'inv-badge-partially'
                                  : item.status === 'Assigned'
                                    ? 'inv-badge-assigned'
                                    : 'inv-badge-out'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            {item.location || 'Jaipur HQ'}
                          </span>
                        </td>
                        <td>
                          <div className="inv-action-btns justify-end">
                            <button
                              type="button"
                              className="btn-icon-soft"
                              onClick={() => setViewingItem(item)}
                              title="View item details & history"
                              aria-label={`View details for ${item.name}`}
                            >
                              <Eye size={14} />
                            </button>

                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  className="btn-assign"
                                  onClick={() => setAssigningItem(item)}
                                  disabled={available <= 0}
                                  title={available <= 0 ? 'Out of stock' : 'Assign to employee'}
                                  aria-label={`Assign ${item.name}`}
                                >
                                  <UserCheck size={13} /> Assign
                                </button>
                                <button
                                  type="button"
                                  className="btn-icon-danger"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  title="Delete inventory item"
                                  aria-label={`Delete ${item.name}`}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: Active Assignments Table */}
        {tab === 'active' && (
          <div className="table-wrap">
            {filteredActiveAssignments.length === 0 ? (
              <div className="inv-empty-state">
                <UserCheck size={40} />
                <h3>No active inventory assignments.</h3>
                <p>
                  {hasActiveFilters
                    ? 'No assignments match the selected filters.'
                    : 'All tools, machinery and equipment are currently in warehouse stock.'}
                </p>
              </div>
            ) : (
              <table className="leads-table" aria-label="Active Inventory Assignments Table">
                <thead>
                  <tr>
                    <th>Item & Asset</th>
                    <th>Assigned To</th>
                    <th>Quantity</th>
                    <th>Assigned Date</th>
                    <th>Expected Return</th>
                    <th>Project / Site</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActiveAssignments.map((asg) => (
                    <tr key={asg.id || asg.assignmentId} className="lead-row">
                      <td>
                        <div className="font-semibold text-slate-900">{asg.itemName}</div>
                        <span className="font-mono text-[11px] text-slate-500">
                          {asg.assetId || asg.inventoryItemId} · {asg.category}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 font-medium text-slate-900">
                          <User size={13} className="text-blue-600" />
                          <span>{asg.employeeName}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">
                          {asg.employeeId}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-slate-900">
                          {asg.quantity} {asg.unit || 'Nos'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600">{asg.assignedDate || '—'}</span>
                      </td>
                      <td>
                        <span className="text-xs font-medium text-amber-700">
                          {asg.expectedReturnDate || 'Open / Indefinite'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-700 truncate max-w-[180px] block">
                          {asg.projectName || 'General Duty'}
                        </span>
                      </td>
                      <td>
                        <div className="inv-action-btns justify-end">
                          {canManage && (
                            <button
                              type="button"
                              className="btn-return"
                              onClick={() => setReturningAssignment(asg)}
                              title="Process equipment return to warehouse"
                            >
                              <RotateCcw size={13} /> Return
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: Assignment History Table */}
        {tab === 'history' && (
          <div className="table-wrap">
            {filteredHistory.length === 0 ? (
              <div className="inv-empty-state">
                <Clock size={40} />
                <h3>No assignment records found.</h3>
                <p>No historical inventory checkout or return records match your filters.</p>
              </div>
            ) : (
              <table className="leads-table" aria-label="Inventory History Table">
                <thead>
                  <tr>
                    <th>Item & Asset</th>
                    <th>Employee</th>
                    <th>Quantity</th>
                    <th>Out Date</th>
                    <th>Return Date</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((asg) => (
                    <tr key={asg.id || asg.assignmentId} className="lead-row">
                      <td>
                        <div className="font-semibold text-slate-900">{asg.itemName}</div>
                        <span className="font-mono text-[11px] text-slate-500">
                          {asg.assetId || asg.inventoryItemId}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium text-slate-900">{asg.employeeName}</div>
                        <span className="text-[11px] font-mono text-slate-500">{asg.employeeId}</span>
                      </td>
                      <td>
                        <span className="font-semibold">
                          {asg.quantity} {asg.unit || 'Nos'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600">{asg.assignedDate || '—'}</span>
                      </td>
                      <td>
                        <span className="text-xs font-semibold text-emerald-700">
                          {asg.returnDate || (asg.status === 'Assigned' ? 'Active' : '—')}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inv-badge ${
                            asg.status === 'Assigned' ? 'inv-badge-assigned' : 'inv-badge-returned'
                          }`}
                        >
                          {asg.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-600 italic line-clamp-1">
                          {asg.returnRemarks || asg.remarks || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* MODALS */}
      {showAddModal && (
        <AddInventoryModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveItem}
        />
      )}

      {assigningItem && (
        <AssignInventoryModal
          item={assigningItem}
          projects={projects}
          onClose={() => setAssigningItem(null)}
          onAssign={handleConfirmAssign}
        />
      )}

      {returningAssignment && (
        <ReturnInventoryModal
          assignment={returningAssignment}
          onClose={() => setReturningAssignment(null)}
          onReturn={handleConfirmReturn}
        />
      )}

      {viewingItem && (
        <InventoryDetailModal
          item={viewingItem}
          assignments={inventoryAssignments}
          onClose={() => setViewingItem(null)}
          onAssign={(item) => setAssigningItem(item)}
          onReturn={(asg) => setReturningAssignment(asg)}
          canManage={canManage}
        />
      )}

      {confirmDeleteId && (() => {
        const item = inventory.find((i) => i.id === confirmDeleteId)
        return (
          <div className="inv-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="del-confirm-title">
            <div className="inv-modal-box" style={{ maxWidth: 400 }}>
              <div style={{ padding: '24px 24px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Trash2 size={18} color="#ef4444" />
                  </span>
                  <h3 id="del-confirm-title" style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Delete Inventory Item?</h3>
                </div>
                {item && (
                  <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                    You are about to permanently delete <strong>{item.name}</strong>{' '}
                    <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>{item.assetId || item.id}</span>.
                    This action cannot be undone.
                  </p>
                )}
              </div>
              <div style={{ padding: '12px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(confirmDeleteId)}
                  style={{ padding: '7px 16px', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 6, background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
