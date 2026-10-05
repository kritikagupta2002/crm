import { TIMELINE_UNITS } from '../data/masters.js'

/*
 * Formats an expected timeline value for display.
 * Handles both new structured objects ({ value, unit }) and legacy strings ("1–3 months").
 */
export function formatTimeline(timeline) {
  if (!timeline) return ''
  if (typeof timeline === 'string') return timeline
  if (typeof timeline === 'object') {
    const val = timeline.value
    const unit = timeline.unit || 'Months'
    if (val !== undefined && val !== null && val !== '') {
      return `${val} ${unit}`
    }
  }
  return ''
}

/*
 * Parses a timeline object or legacy string into a uniform { value, unit } shape.
 */
export function parseTimeline(timeline) {
  if (!timeline) {
    return { value: '', unit: 'Months' }
  }
  if (typeof timeline === 'object') {
    return {
      value: timeline.value !== undefined && timeline.value !== null ? String(timeline.value) : '',
      unit: TIMELINE_UNITS.includes(timeline.unit) ? timeline.unit : 'Months',
    }
  }
  if (typeof timeline === 'string') {
    const match = timeline.trim().match(/^(\d+)\s*(Days?|Months?|Years?)$/i)
    if (match) {
      const num = Number(match[1])
      const rawUnit = match[2].toLowerCase()
      const normalizedUnit = rawUnit.startsWith('day') ? 'Days' : rawUnit.startsWith('year') ? 'Years' : 'Months'
      return { value: String(num), unit: normalizedUnit }
    }
  }
  return { value: '', unit: 'Months' }
}

/*
 * Validates a timeline object.
 * Returns an error string if invalid, or null if valid.
 */
export function validateTimeline(timeline) {
  if (!timeline || (timeline.value === '' && !timeline.unit)) {
    return null
  }
  const val = Number(timeline.value)
  if (isNaN(val) || !Number.isInteger(val) || val <= 0) {
    return 'Expected timeline duration must be a positive whole number greater than 0'
  }
  if (!TIMELINE_UNITS.includes(timeline.unit)) {
    return `Timeline unit must be one of: ${TIMELINE_UNITS.join(', ')}`
  }
  return null
}
