import { TIMELINE_UNITS } from '../../data/masters'
import { parseTimeline } from '../../utils/timeline'

/*
 * ExpectedTimelineInput
 * Provides a flexible duration input: [ Number ] [ Unit ]
 * Supported units: Days, Months, Years
 * Emits: { value: number, unit: 'Days' | 'Months' | 'Years' } or '' when empty
 */
export function ExpectedTimelineInput({ value, onChange, error, disabled = false, id }) {
  const parsed = parseTimeline(value)

  const handleValueChange = (e) => {
    const raw = e.target.value
    if (raw === '') {
      onChange('')
      return
    }
    const num = parseInt(raw, 10)
    onChange({
      value: isNaN(num) ? raw : num,
      unit: parsed.unit || 'Months',
    })
  }

  const handleUnitChange = (e) => {
    const newUnit = e.target.value
    if (parsed.value === '') {
      onChange({ value: '', unit: newUnit })
      return
    }
    onChange({
      value: Number(parsed.value),
      unit: newUnit,
    })
  }

  return (
    <div className={`timeline-input-group ${error ? 'has-error' : ''}`}>
      <input
        id={id}
        type="number"
        min="1"
        step="1"
        placeholder="e.g. 10"
        value={parsed.value}
        onChange={handleValueChange}
        disabled={disabled}
        aria-label="Timeline duration"
        className="timeline-value-input"
      />
      <select
        value={parsed.unit}
        onChange={handleUnitChange}
        disabled={disabled}
        aria-label="Timeline unit"
        className="timeline-unit-select"
      >
        {TIMELINE_UNITS.map((unit) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </div>
  )
}
