import type { DFA } from '../types/automata'
import { formatSet } from './automataHelpers'
import { GRAPH_HEIGHT, GRAPH_WIDTH, circularLayout, type Point } from './layout'

type ThemeName = 'light' | 'dark'

export interface SvgOptions {
  theme?: ThemeName
  background?: boolean
}

const PALETTE = {
  light: {
    background: '#FAFAF7',
    edge: '#8a958a',
    labelBg: '#F2F5EF',
    labelBorder: '#C7D3C1',
    labelText: '#3e4c3f',
    nodeFill: '#FAFAF7',
    nodeStroke: '#465447',
    nodeText: '#292D29',
    initial: '#465447',
    final: '#465447',
    legend: '#465447',
  },
  dark: {
    background: '#151a16',
    edge: '#8f9c8c',
    labelBg: '#1b211c',
    labelBorder: '#3a443a',
    labelText: '#C7D3C1',
    nodeFill: '#1b211c',
    nodeStroke: '#A8B5A0',
    nodeText: '#F2F5EF',
    initial: '#C7D3C1',
    final: '#A8B5A0',
    legend: '#A8B5A0',
  },
} as const

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function arrowPoints(tip: Point, from: Point, size = 9, spread = 4.5): string {
  const dx = tip.x - from.x
  const dy = tip.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const baseX = tip.x - ux * size
  const baseY = tip.y - uy * size
  const px = -uy
  const py = ux
  return [
    `${tip.x},${tip.y}`,
    `${baseX + px * spread},${baseY + py * spread}`,
    `${baseX - px * spread},${baseY - py * spread}`,
  ].join(' ')
}

/**
 * Standalone SVG for challenge previews and for SVG/PNG export.
 * Uses the same circular layout as the interactive React Flow graph.
 */
export function buildDfaSvg(dfa: DFA, options: SvgOptions = {}): string {
  const theme = options.theme ?? 'light'
  const colors = PALETTE[theme]
  const positions = circularLayout(dfa.states)
  const radius = 30
  const layoutCenter = { x: GRAPH_WIDTH / 2, y: GRAPH_HEIGHT / 2 + 10 }

  const edgeMap = new Map<string, { from: string; to: string; symbols: string[] }>()
  for (const from of dfa.states) {
    for (const symbol of dfa.alphabet) {
      const to = dfa.transitions[from]?.[symbol]
      if (!to || !positions[to]) continue
      const key = `${from}\u0001${to}`
      const existing = edgeMap.get(key)
      if (existing) existing.symbols.push(symbol)
      else edgeMap.set(key, { from, to, symbols: [symbol] })
    }
  }

  const reverseExists = (from: string, to: string) => edgeMap.has(`${to}\u0001${from}`)

  const edges: string[] = []
  const labels: string[] = []
  const nodes: string[] = []

  for (const edge of edgeMap.values()) {
    const source = positions[edge.from]
    const target = positions[edge.to]
    const label = edge.symbols.join(', ')

    if (edge.from === edge.to) {
      const start = { x: source.x - 15, y: source.y - radius + 2 }
      const end = { x: source.x + 15, y: source.y - radius + 2 }
      const c1 = { x: source.x - 54, y: source.y - radius - 58 }
      const c2 = { x: source.x + 54, y: source.y - radius - 58 }
      const path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`
      edges.push(
        `<path d="${path}" fill="none" stroke="${colors.edge}" stroke-width="1.8" stroke-linecap="round" />`,
      )
      edges.push(
        `<polygon points="${arrowPoints(end, c2)}" fill="${colors.edge}" />`,
      )
      const labelWidth = Math.max(22, label.length * 7 + 10)
      const labelY = source.y - radius - 66
      labels.push(
        `<rect x="${source.x - labelWidth / 2}" y="${labelY - 9}" width="${labelWidth}" height="17" rx="4" fill="${colors.labelBg}" stroke="${colors.labelBorder}" />`,
      )
      labels.push(
        `<text x="${source.x}" y="${labelY + 3.5}" text-anchor="middle" font-size="10" font-weight="600" fill="${colors.labelText}">${escapeXml(label)}</text>`,
      )
      continue
    }

    const dx = target.x - source.x
    const dy = target.y - source.y
    const length = Math.hypot(dx, dy) || 1
    const ux = dx / length
    const uy = dy / length
    const start = { x: source.x + ux * (radius + 1), y: source.y + uy * (radius + 1) }
    const end = { x: target.x - ux * (radius + 2), y: target.y - uy * (radius + 2) }
    const offset = reverseExists(edge.from, edge.to) ? 38 : 0
    const px = -uy
    const py = ux
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    const control = { x: mid.x + px * offset * 2, y: mid.y + py * offset * 2 }
    const path = `M ${start.x} ${start.y} Q ${control.x} ${control.y}, ${end.x} ${end.y}`
    edges.push(
      `<path d="${path}" fill="none" stroke="${colors.edge}" stroke-width="1.8" stroke-linecap="round" />`,
    )
    edges.push(`<polygon points="${arrowPoints(end, control)}" fill="${colors.edge}" />`)

    const labelPoint = { x: mid.x + px * offset, y: mid.y + py * offset }
    const labelWidth = Math.max(20, label.length * 6.8 + 9)
    labels.push(
      `<rect x="${labelPoint.x - labelWidth / 2}" y="${labelPoint.y - 8.5}" width="${labelWidth}" height="16" rx="4" fill="${colors.labelBg}" stroke="${colors.labelBorder}" />`,
    )
    labels.push(
      `<text x="${labelPoint.x}" y="${labelPoint.y + 3}" text-anchor="middle" font-size="9.5" font-weight="600" fill="${colors.labelText}">${escapeXml(label)}</text>`,
    )
  }

  for (const state of dfa.states) {
    const point = positions[state]
    const isFinal = dfa.finalStates.includes(state)
    const isInitial = state === dfa.initialState
    const fontSize = state.length > 5 ? 9 : state.length > 3 ? 11 : 14
    nodes.push(
      `<g><circle cx="${point.x}" cy="${point.y}" r="${radius}" fill="${colors.nodeFill}" stroke="${colors.nodeStroke}" stroke-width="1.8" />`,
    )
    if (isFinal) {
      nodes.push(
        `<circle cx="${point.x}" cy="${point.y}" r="${radius - 5}" fill="none" stroke="${colors.nodeStroke}" stroke-width="1.2" />`,
      )
    }
    nodes.push(
      `<text x="${point.x}" y="${point.y + fontSize * 0.36}" text-anchor="middle" font-size="${fontSize}" font-weight="650" fill="${colors.nodeText}">${escapeXml(state)}</text>`,
    )
    if (isInitial) {
      const angle =
        dfa.states.length === 1
          ? Math.PI
          : Math.atan2(point.y - layoutCenter.y, point.x - layoutCenter.x) || Math.PI
      const dirX = Math.cos(angle)
      const dirY = Math.sin(angle)
      const tip = { x: point.x + dirX * (radius + 3), y: point.y + dirY * (radius + 3) }
      const start = { x: point.x + dirX * (radius + 35), y: point.y + dirY * (radius + 35) }
      nodes.push(
        `<line x1="${start.x}" y1="${start.y}" x2="${tip.x}" y2="${tip.y}" stroke="${colors.initial}" stroke-width="2" stroke-linecap="round" />`,
      )
      nodes.push(
        `<polygon points="${arrowPoints(tip, start, 8, 4)}" fill="${colors.initial}" />`,
      )
      const textPoint = {
        x: point.x + dirX * (radius + 48),
        y: point.y + dirY * (radius + 48),
      }
      nodes.push(
        `<text x="${textPoint.x}" y="${textPoint.y}" text-anchor="middle" font-size="9" font-weight="700" fill="${colors.initial}">start</text>`,
      )
    }
    nodes.push('</g>')
  }

  const background = options.background
    ? `<rect width="${GRAPH_WIDTH}" height="${GRAPH_HEIGHT}" fill="${colors.background}" />`
    : ''
  const legend = `<text x="20" y="${GRAPH_HEIGHT - 16}" font-size="10" fill="${colors.legend}">→ start   ◎ accepting   ·   ${dfa.states.length} states, alphabet ${escapeXml(formatSet(dfa.alphabet))}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${GRAPH_WIDTH}" height="${GRAPH_HEIGHT}" viewBox="0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}" role="img" aria-label="DFA state diagram">
${background}
<g>${edges.join('')}</g>
<g>${labels.join('')}</g>
<g>${nodes.join('')}</g>
${legend}
</svg>`
}

/* ------------------------------------------------------------------ */
/* Downloads                                                           */
/* ------------------------------------------------------------------ */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function safeName(name: string): string {
  return name.replace(/[^a-z0-9-_]+/gi, '_').replace(/_+/g, '_')
}

export function transitionTableCsv(dfa: DFA): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
  const header = ['State', ...dfa.alphabet, 'Type']
  const rows = dfa.states.map((state) => {
    const flags: string[] = []
    if (state === dfa.initialState) flags.push('initial')
    if (dfa.finalStates.includes(state)) flags.push('accepting')
    return [
      state,
      ...dfa.alphabet.map((symbol) => dfa.transitions[state]?.[symbol] ?? ''),
      flags.join(' ') || 'normal',
    ]
  })
  return [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
}

export function downloadCsv(dfa: DFA, filename: string) {
  downloadBlob(new Blob([`\uFEFF${transitionTableCsv(dfa)}`], { type: 'text/csv;charset=utf-8' }), filename)
}

export function downloadSvg(dfa: DFA, filename: string) {
  const svg = buildDfaSvg(dfa, { theme: 'light', background: true })
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), filename)
}

export async function downloadPng(dfa: DFA, filename: string, scale = 2): Promise<void> {
  const svg = buildDfaSvg(dfa, { theme: 'light', background: true })
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.decoding = 'sync'
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('Could not render the diagram for PNG export.'))
      image.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = GRAPH_WIDTH * scale
    canvas.height = GRAPH_HEIGHT * scale
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas is not available in this browser.')
    context.fillStyle = '#FAFAF7'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!pngBlob) throw new Error('Could not create the PNG file.')
    downloadBlob(pngBlob, filename)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function printSummary() {
  window.print()
}

export { safeName }
