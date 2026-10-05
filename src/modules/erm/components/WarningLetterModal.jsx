import { useEffect, useId, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  FileText,
  Printer,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { Portal } from '../../../shared/components/Portal'
import { useCrm } from '../../../core/permissions/crm'
import { TODAY } from '../../crm/data/mockData'
import { FIELD_MEMBERS, titleOf } from '../data/staff'
import { formatDate, toISODate } from '../../../shared/utils/date'
import { getTaskId, findIssuedWarningLetter } from '../utils/overdue'
import './warningLetter.css'

function getDefaultBodyText({ assigneeName, taskTitle, projectName, projectId, dueDate, overdueDays, todayISO }) {
  const formattedDue = dueDate ? formatDate(dueDate) : 'the agreed timeline'
  const formattedToday = formatDate(todayISO)
  return `Dear ${assigneeName},

This is a formal written notice regarding the non-completion and timeline breach of your assigned deliverable "${taskTitle}" under project ${projectName} (${projectId}).

As recorded in the ERM project schedule, this deliverable was assigned to you with a stipulated completion date of ${formattedDue}. As of today, ${formattedToday}, the task remains incomplete and has exceeded the defined timeline by ${overdueDays} calendar days.

Timely completion of milestone deliverables is crucial to maintaining statutory schedules, government report submissions, and client commitments. Unplanned delays adversely affect interrelated operations and subsequent approval phases.

You are instructed to immediately prioritize this pending task and communicate an expedited completion schedule. If you are experiencing technical or on-site bottlenecks, escalate them to project management immediately with documented justification.

Please note this formal warning on your deliverable record.`
}

export function WarningLetterModal({ task, project, onClose, onIssued }) {
  const { warningLetters, issueWarningLetter, updateWarningLetter, user } = useCrm()
  const titleId = useId()
  const todayISO = toISODate(TODAY)

  const taskId = getTaskId(task, project)
  const existingLetter = findIssuedWarningLetter(task, project, warningLetters)

  // Find employee title and ID if available
  const assigneeName = task.assignee || 'Unassigned'
  const staffMember = FIELD_MEMBERS.find((m) => m.name === assigneeName)
  const employeeTitle = staffMember?.title || titleOf(assigneeName) || 'Project Team Member'
  const employeeId = staffMember?.id || (staffMember ? `BGS-${assigneeName.split(' ')[0].toUpperCase()}` : null)

  const overdueDays = task.overdueDays || 0
  const year = TODAY.getFullYear()
  const nextSeq = String((warningLetters?.length || 0) + 1).padStart(3, '0')
  const previewLetterNumber = existingLetter?.letterNumber || `BGS/WL/${year}/${nextSeq}`

  const defaultBody = useMemo(
    () =>
      getDefaultBodyText({
        assigneeName,
        taskTitle: task.title,
        projectName: project.name,
        projectId: project.id,
        dueDate: task.due,
        overdueDays,
        todayISO,
      }),
    [assigneeName, task.title, project.name, project.id, task.due, overdueDays, todayISO]
  )

  const [isEditing, setIsEditing] = useState(false)
  const [subject, setSubject] = useState(
    existingLetter?.subject || 'FORMAL WRITTEN WARNING FOR OVERDUE TASK DELIVERY'
  )
  const [bodyText, setBodyText] = useState(existingLetter?.customBody || defaultBody)
  const [remarks, setRemarks] = useState(existingLetter?.remarks || '')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Sync state if existingLetter changes
  useEffect(() => {
    if (existingLetter) {
      if (existingLetter.subject) setSubject(existingLetter.subject)
      if (existingLetter.customBody) setBodyText(existingLetter.customBody)
      if (existingLetter.remarks) setRemarks(existingLetter.remarks)
    }
  }, [existingLetter])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleIssue = () => {
    if (overdueDays < 3) {
      setError('Warning letters can only be issued for tasks overdue by 3 or more days.')
      return
    }
    if (!subject.trim()) {
      setError('Subject cannot be empty.')
      return
    }
    if (!bodyText.trim()) {
      setError('Letter body text cannot be empty.')
      return
    }
    try {
      const record = issueWarningLetter({
        taskId,
        taskKey: task.key || task.id,
        taskTitle: task.title,
        projectId: project.id,
        projectName: project.name,
        clientName: project.lead?.company || project.lead?.clientName || '',
        employeeName: assigneeName,
        employeeId,
        dueDate: task.due,
        overdueDays,
        subject: subject.trim(),
        customBody: bodyText.trim(),
        remarks: remarks.trim() || null,
      })
      setSuccessMsg('Warning letter officially issued.')
      setError('')
      setIsEditing(false)
      onIssued?.(record)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleUpdate = () => {
    if (!existingLetter) return
    if (!subject.trim()) {
      setError('Subject cannot be empty.')
      return
    }
    if (!bodyText.trim()) {
      setError('Letter body text cannot be empty.')
      return
    }
    try {
      updateWarningLetter(existingLetter.id, {
        subject: subject.trim(),
        customBody: bodyText.trim(),
        remarks: remarks.trim() || null,
        letterNumber: existingLetter.letterNumber,
        projectId: project.id,
      })
      setSuccessMsg('Warning letter updated successfully.')
      setError('')
      setIsEditing(false)
      setTimeout(() => setSuccessMsg(''), 4000)
    } catch (err) {
      setError(err.message || 'Failed to update warning letter.')
    }
  }

  const handlePrint = () => {
    setIsEditing(false)
    setTimeout(() => {
      window.print()
    }, 50)
  }

  return (
    <Portal>
      <div className="dialog-root warning-letter-dialog-root">
        <div className="dialog-backdrop no-print" onClick={onClose} />
        <div
          className="dialog warning-letter-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {/* Header Bar */}
          <div className="warning-modal-header no-print">
            <div className="warning-modal-title">
              <span className="warning-icon-badge">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h2 id={titleId}>Formal Warning Letter</h2>
                <span className="muted small">
                  {existingLetter ? `Issued · ${existingLetter.letterNumber}` : `Draft · ${previewLetterNumber}`}
                </span>
              </div>
            </div>

            <div className="warning-header-actions">
              {/* Segmented Mode Switch */}
              <div className="warning-view-switch" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={!isEditing}
                  className={!isEditing ? 'active' : ''}
                  onClick={() => setIsEditing(false)}
                  title="Preview official letterhead sheet"
                >
                  <Eye size={13} /> Preview Sheet
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={isEditing}
                  className={isEditing ? 'active' : ''}
                  onClick={() => setIsEditing(true)}
                  title="Edit warning letter content"
                >
                  <Edit3 size={13} /> Edit Letter
                </button>
              </div>

              {!isEditing && (
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={handlePrint}
                  title="Print or Save as PDF"
                >
                  <Printer size={14} /> Print
                </button>
              )}

              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Success Message Banner */}
          {successMsg && (
            <div className="warning-success-banner no-print" role="status">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Already Issued Notice Banner */}
          {existingLetter && !successMsg && (
            <div className="warning-status-banner no-print" role="status">
              <CheckCircle2 size={16} />
              <div style={{ flex: 1 }}>
                <strong>Warning Letter Officially Issued ({existingLetter.letterNumber})</strong>
                <span>
                  Issued by {existingLetter.issuedBy} ({existingLetter.issuerRole}) on{' '}
                  {formatDate(existingLetter.issuedDate)}. You can edit and update this letter anytime.
                </span>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  className="warning-btn-action"
                  onClick={() => setIsEditing(true)}
                  title="Click to edit and update this warning letter"
                >
                  <Edit3 size={13} /> Edit Letter
                </button>
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="warning-error-banner no-print" role="alert">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* EDIT PANEL (When in Edit Letter mode) */}
          {isEditing && (
            <div className="warning-edit-panel no-print">
              <div className="warning-edit-card">
                <label className="field-label" htmlFor="warning-subject-input">
                  <strong>Subject / Letter Heading</strong>
                </label>
                <input
                  id="warning-subject-input"
                  type="text"
                  className="warning-edit-input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. FORMAL WRITTEN WARNING FOR OVERDUE TASK DELIVERY"
                />
              </div>

              <div className="warning-edit-card">
                <div className="warning-edit-header">
                  <strong>Letter Body (Write or customize your own text)</strong>
                  <div className="warning-template-actions">
                    <button
                      type="button"
                      className="warning-btn-action"
                      onClick={() => setBodyText(defaultBody)}
                      title="Reset to official standard draft template"
                    >
                      <RotateCcw size={12} /> Standard Template
                    </button>
                    <button
                      type="button"
                      className="warning-btn-action"
                      onClick={() => setBodyText('')}
                      title="Clear content to write your letter from scratch"
                    >
                      <Trash2 size={12} /> Clear / Blank
                    </button>
                  </div>
                </div>
                <textarea
                  className="warning-edit-textarea"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Type your warning letter here. You can write your own sentences, timeline details, penalties, or explanations..."
                  rows={13}
                />
                <span className="muted small">
                  Tip: Write paragraphs freely. Separate multiple paragraphs with a blank line (double enter).
                </span>
              </div>

              <div className="warning-edit-card">
                <label className="field-label" htmlFor="warning-remarks-input">
                  <strong>Specific Management Directives / Action Points (Optional)</strong>
                </label>
                <textarea
                  id="warning-remarks-input"
                  className="warning-edit-textarea"
                  style={{ minHeight: '80px' }}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Provide expedited field samples by tomorrow 5 PM; report immediately to Project Coordinator."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* PREVIEW SHEET (The Formal Printable A4 Document) */}
          {(!isEditing || false) && (
            <div className={`warning-letter-sheet ${isEditing ? 'no-print' : ''}`} style={isEditing ? { display: 'none' } : undefined}>
              {/* Letterhead */}
              <div className="letterhead">
                <div className="letterhead-brand">
                  <div className="letterhead-company">BANSAL GEO SOLUTIONS PVT. LTD.</div>
                  <div className="letterhead-sub">
                    Exploration, Mining, Hydrogeology & Remote Sensing Solutions
                  </div>
                  <div className="letterhead-address">
                    C-Scheme, Jaipur, Rajasthan 302001 · info@bansalgeo.com · +91 98876 95208
                  </div>
                </div>
                <div className="letterhead-tag">OFFICIAL NOTICE</div>
              </div>

              <div className="letterhead-divider" />

              {/* Letter Meta Grid */}
              <div className="letter-meta-grid">
                <div className="meta-col">
                  <div className="meta-item">
                    <span className="meta-label">Letter Reference:</span>
                    <span className="meta-val mono-sub">{previewLetterNumber}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">To (Employee):</span>
                    <span className="meta-val">
                      <strong>{assigneeName}</strong>
                      {employeeTitle && ` (${employeeTitle})`}
                    </span>
                  </div>
                  {employeeId && (
                    <div className="meta-item">
                      <span className="meta-label">Employee ID:</span>
                      <span className="meta-val mono-sub">{employeeId}</span>
                    </div>
                  )}
                  <div className="meta-item">
                    <span className="meta-label">Project:</span>
                    <span className="meta-val">
                      {project.name} ({project.id})
                    </span>
                  </div>
                </div>

                <div className="meta-col meta-col-right">
                  <div className="meta-item">
                    <span className="meta-label">Date of Issue:</span>
                    <span className="meta-val">
                      {formatDate(existingLetter?.issuedDate || todayISO)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Scheduled Due Date:</span>
                    <span className="meta-val">{task.due ? formatDate(task.due) : 'Not specified'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Overdue Delay:</span>
                    <span className="meta-val text-red font-semibold">
                      {overdueDays} {overdueDays === 1 ? 'Calendar Day' : 'Calendar Days'}
                    </span>
                  </div>
                  {project.lead?.company && (
                    <div className="meta-item">
                      <span className="meta-label">Client Organisation:</span>
                      <span className="meta-val">{project.lead.company}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject Line */}
              <div className="letter-subject">
                <strong>SUBJECT:</strong> {subject?.trim() || 'FORMAL WRITTEN WARNING FOR OVERDUE TASK DELIVERY'}
              </div>

              {/* Formal Letter Body */}
              <div className="letter-body-content">
                {bodyText?.trim() ? (
                  bodyText
                    .split(/\n\s*\n/)
                    .map((paragraph, index) => (
                      <p key={index} style={{ whiteSpace: 'pre-wrap' }}>
                        {paragraph}
                      </p>
                    ))
                ) : (
                  <p className="muted" style={{ fontStyle: 'italic' }}>
                    No letter body text provided. Click &quot;Edit Letter&quot; above to compose.
                  </p>
                )}

                {/* Specific Remarks/Directives */}
                {remarks?.trim() && (
                  <div className="letter-remarks-box">
                    <strong>Specific Management Directives:</strong>
                    <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{remarks}</p>
                  </div>
                )}
              </div>

              {/* Sign-off Block */}
              <div className="letter-signoff">
                <div className="signoff-item">
                  <span className="signoff-label">Issued By:</span>
                  <span className="signoff-val">{existingLetter?.issuedBy || user?.name || 'Project Management'}</span>
                  <span className="signoff-sub">{existingLetter?.issuerRole || user?.title || 'Operations Manager'}</span>
                  <span className="signoff-sub">Bansal Geo Solutions Pvt. Ltd.</span>
                </div>
                <div className="signoff-item signoff-right">
                  <span className="signoff-label">Acknowledged By:</span>
                  <div className="signoff-line" />
                  <span className="signoff-sub">{assigneeName} (Assignee)</span>
                </div>
              </div>
            </div>
          )}

          {/* Dialog Action Footer */}
          <div className="warning-modal-footer no-print">
            {isEditing ? (
              <>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setError('')
                    setIsEditing(false)
                  }}
                >
                  <Eye size={14} /> Back to Preview
                </button>

                {existingLetter ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpdate}
                  >
                    <Check size={15} /> Save Changes
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-issue-warning"
                    onClick={handleIssue}
                    disabled={overdueDays < 3}
                  >
                    <AlertTriangle size={15} /> Issue Formal Warning
                  </button>
                )}
              </>
            ) : (
              <>
                <button type="button" className="btn" onClick={onClose}>
                  Close
                </button>

                <button
                  type="button"
                  className="btn"
                  onClick={() => setIsEditing(true)}
                  title="Edit Subject, Body text, or Directives"
                >
                  <Edit3 size={14} /> Edit Letter
                </button>

                {existingLetter ? (
                  <button type="button" className="btn btn-primary" onClick={handlePrint}>
                    <Printer size={15} /> Print / Save PDF
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-primary btn-issue-warning"
                    onClick={handleIssue}
                    disabled={overdueDays < 3}
                  >
                    <AlertTriangle size={15} /> Issue Formal Warning
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Portal>
  )
}
