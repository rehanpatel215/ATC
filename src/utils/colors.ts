/** Text-safe palette used for equivalence-group badges and node accents. */
export const GROUP_COLORS = [
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#d97706',
  '#e11d48',
  '#0284c7',
  '#4d7c0f',
  '#c026d3',
  '#ea580c',
  '#0f766e',
]

export function groupColor(index: number): string {
  return GROUP_COLORS[index % GROUP_COLORS.length]
}

export function groupBadge(index: number): string {
  return `G${index + 1}`
}

export const PHASE_META: Record<string, { label: string; tone: string }> = {
  validate: { label: 'Validation', tone: 'chip-neutral' },
  reachability: { label: 'Reachability', tone: 'chip-indigo' },
  pairs: { label: 'State pairs', tone: 'chip-indigo' },
  initial: { label: 'Initial marking', tone: 'chip-amber' },
  refinement: { label: 'Refinement', tone: 'chip-amber' },
  equivalence: { label: 'Equivalence', tone: 'chip-emerald' },
  build: { label: 'Rebuild', tone: 'chip-indigo' },
  done: { label: 'Complete', tone: 'chip-emerald' },
}
