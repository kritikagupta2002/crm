/*
 * Stages follow the dashboard colour code:
 * blue = getting started, amber = in progress (needs attention), green = won, red = lost.
 * Shades deepen as a lead moves further along within its phase.
 */
export const STAGE_COLORS = {
  'New Enquiry': { bg: '#eaf2fc', fg: '#1f5a99', dot: '#6a9fd8' },
  Contacted: { bg: '#d6e6f8', fg: '#1f5a99', dot: 'var(--blue)' },
  Qualified: { bg: '#fdf4e3', fg: '#8a5a0b', dot: '#e3b562' },
  'Proposal Sent': { bg: '#fbe8c6', fg: '#8a5a0b', dot: '#d99a2b' },
  Negotiation: { bg: '#f7d9a0', fg: '#734806', dot: 'var(--amber)' },
  Won: { bg: 'var(--green-bg)', fg: 'var(--green)', dot: 'var(--green)' },
  Lost: { bg: 'var(--red-bg)', fg: 'var(--red)', dot: 'var(--red)' },
}
