import { TODAY } from './mockData'
import { addDays, toISODate } from '../utils/date'

/*
 * Questions clients have asked from the portal: one answered and one still open, so the demo shows
 * both sides. Anything asked or answered in the app is kept on the enquiry as `queries`.
 */
const at = (days, time) => `${toISODate(addDays(TODAY, days))}T${time}:00.000Z`

export const QUERY_TOPICS = ['Project', 'Documents', 'Billing', 'Other']

const SEEDED = {
  'BG-2026-001': [
    {
      id: 'Q-001-1',
      topic: 'Documents',
      message: 'Can you share the acceptance letter from DMG? Our bank has asked for a copy.',
      at: at(-30, '05:10'),
      status: 'Answered',
      reply: 'It is now under Government letters in your portal (DMG/RAJ/2026/1373/2). Download it any time.',
      repliedAt: at(-30, '08:40'),
      repliedBy: 'R. Mehta',
    },
  ],
  'BG-2026-038': [
    {
      id: 'Q-038-1',
      topic: 'Project',
      message: 'When will the field team come for the last pit? We need to plan the site access.',
      at: at(-1, '06:25'),
      status: 'Open',
    },
  ],
}

/* A client's questions: the ones asked in the app, else the demo's seeded ones. Newest first. */
export const queriesOf = (lead) => [...(lead.queries ?? SEEDED[lead.id] ?? [])].sort((a, b) => b.at.localeCompare(a.at))
