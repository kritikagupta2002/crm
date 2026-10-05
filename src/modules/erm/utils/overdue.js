import { TODAY } from '../../crm/data/mockData.js'
import { parseISODate, toISODate } from '../../../shared/utils/date.js'

/**
 * Calculates calendar days elapsed past a task's due date.
 * Rules:
 * - Completed tasks (status === 'done') are NEVER overdue -> returns 0.
 * - Tasks with no due date are not overdue -> returns 0.
 * - Tasks due today or in the future -> returns 0.
 * - Incomplete tasks past due date -> exact positive calendar days elapsed.
 *
 * @param {Object} task - The task object with { due, status }
 * @param {Date|string} today - Current reference date (defaults to TODAY)
 * @returns {number} Non-negative integer representing overdue calendar days.
 */
export function getTaskOverdueDays(task, today = TODAY || new Date()) {
  if (!task || task.status === 'done' || !task.due) return 0

  const todayDate =
    typeof today === 'string'
      ? parseISODate(today)
      : new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const dueDate = parseISODate(task.due)
  const diffMs = todayDate.getTime() - dueDate.getTime()

  if (diffMs <= 0) return 0
  return Math.round(diffMs / 86_400_000)
}

/**
 * Checks whether a task is overdue.
 *
 * @param {Object} task
 * @param {Date|string} today
 * @returns {boolean}
 */
export function isTaskOverdue(task, today = TODAY || new Date()) {
  return getTaskOverdueDays(task, today) > 0
}

/**
 * Determines whether a formal warning letter can be issued for a task.
 * Business requirement: Task overdue after 3 days from timeline (overdueDays >= 3).
 *
 * @param {Object} task
 * @param {Date|string} today
 * @returns {boolean}
 */
export function canIssueWarningLetter(task, today = TODAY || new Date()) {
  if (!task || task.status === 'done') return false
  return getTaskOverdueDays(task, today) >= 3
}

/**
 * Formats overdue days into a user-friendly label.
 *
 * @param {number} days
 * @returns {string} e.g. "3 Days Overdue", "1 Day Overdue", or ""
 */
export function formatOverdueLabel(days) {
  if (!days || days <= 0) return ''
  return `${days} ${days === 1 ? 'Day' : 'Days'} Overdue`
}

/**
 * Gets a stable task key / identifier across projects.
 *
 * @param {Object} task
 * @param {string|Object} project
 * @returns {string}
 */
export function getTaskId(task, project) {
  const projId = project?.id || project || ''
  return `${projId}-${task.key ?? task.id}`
}

/**
 * Checks if a warning letter has already been issued for a task.
 *
 * @param {Object} task
 * @param {string|Object} project
 * @param {Array} warningLetters
 * @returns {Object|null} The issued warning letter record or null
 */
export function findIssuedWarningLetter(task, project, warningLetters = []) {
  if (!task || !warningLetters || warningLetters.length === 0) return null
  const taskId = getTaskId(task, project)
  return warningLetters.find((wl) => wl.taskId === taskId && wl.status === 'Issued') || null
}
