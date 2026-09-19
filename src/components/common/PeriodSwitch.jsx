import { usePeriod } from '../../context/period'

const OPTIONS = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'FY' },
]

export function PeriodSwitch() {
  const { period, setPeriod } = usePeriod()
  return (
    <div className="segmented" role="group" aria-label="Reporting period">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          aria-pressed={period === option.value}
          className={period === option.value ? 'is-selected' : ''}
          onClick={() => setPeriod(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
