/*
 * ============================================================
 *  STAGE COLORS — CRM Theme
 *  Lead/deal pipeline stage colour map (JS module).
 *  Import and apply bg/fg/dot values to stage pills.
 * ============================================================
 */

/*
 * Stages follow the dashboard colour code:
 *   blue  = getting started
 *   amber = in progress (needs attention), deepening towards negotiation
 *   green = won
 *   red   = lost
 */
export const STAGE_COLORS = {
  'New Enquiry':    { bg: '#eaf2fc', fg: '#1f5a99', dot: '#6a9fd8'       },
  'Contacted':      { bg: '#d6e6f8', fg: '#1f5a99', dot: 'var(--blue)'   },
  'Qualified':      { bg: '#fdf4e3', fg: '#8a5a0b', dot: '#e3b562'       },
  'Proposal Sent':  { bg: '#fbe8c6', fg: '#8a5a0b', dot: '#d99a2b'       },
  'Negotiation':    { bg: '#f7d9a0', fg: '#734806', dot: 'var(--amber)'  },
  'Won':            { bg: 'var(--green-bg)', fg: 'var(--green)', dot: 'var(--green)' },
  'Lost':           { bg: 'var(--red-bg)',   fg: 'var(--red)',   dot: 'var(--red)'   },
}

/*
 * Usage:
 *   import { STAGE_COLORS } from './theme/stageColors.js'
 *   const { bg, fg, dot } = STAGE_COLORS[lead.stage] ?? {}
 *   <span style={{ background: bg, color: fg }}>{ lead.stage }</span>
 */
