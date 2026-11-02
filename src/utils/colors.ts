/** Text-safe palette used for equivalence-group badges and node accents. */
export const GROUP_COLORS = [
  '#465447',
  '#687861',
  '#8a6d38',
  '#7a5b45',
  '#5f6b7a',
  '#8a5a5a',
  '#4f6b62',
  '#6b5b7a',
  '#7c6a3f',
  '#3f5a6b',
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
