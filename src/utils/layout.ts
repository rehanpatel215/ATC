export const GRAPH_WIDTH = 780
export const GRAPH_HEIGHT = 600
export const NODE_SIZE = 64

export interface Point {
  x: number
  y: number
}

export function circularLayout(states: string[]): Record<string, Point> {
  const positions: Record<string, Point> = {}
  const centerX = GRAPH_WIDTH / 2
  const centerY = GRAPH_HEIGHT / 2 + 10
  const count = states.length
  if (count === 0) return positions
  if (count === 1) {
    positions[states[0]] = { x: centerX, y: centerY }
    return positions
  }

  const radius =
    count <= 2
      ? 160
      : count <= 4
        ? 158
        : count <= 6
          ? 172
          : count <= 8
            ? 188
            : count <= 10
              ? 198
              : 202

  states.forEach((state, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
    positions[state] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  })
  return positions
}
