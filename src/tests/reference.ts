import type { DFA } from '../types/automata'

/**
 * Independent reference implementation used only in tests.
 * Moore's partition-refinement algorithm is structurally different from the
 * table-filling method, which makes it a useful cross-check.
 */
export function referenceReachable(dfa: DFA): string[] {
  const visited = new Set<string>([dfa.initialState])
  const queue = [dfa.initialState]
  while (queue.length > 0) {
    const state = queue.shift() as string
    for (const symbol of dfa.alphabet) {
      const next = dfa.transitions[state]?.[symbol]
      if (next && !visited.has(next)) {
        visited.add(next)
        queue.push(next)
      }
    }
  }
  return dfa.states.filter((state) => visited.has(state))
}

export function referenceMinimize(dfa: DFA): string[][] {
  const reachable = referenceReachable(dfa)
  const order = new Map(dfa.states.map((state, index) => [state, index]))
  const finalSet = new Set(dfa.finalStates)

  const finalStates = reachable.filter((state) => finalSet.has(state))
  const nonFinalStates = reachable.filter((state) => !finalSet.has(state))
  let blocks: string[][] = [finalStates, nonFinalStates].filter((block) => block.length > 0)

  for (;;) {
    const blockOf: Record<string, number> = {}
    blocks.forEach((block, index) => block.forEach((state) => (blockOf[state] = index)))

    const nextBlocks: string[][] = []
    for (const block of blocks) {
      const buckets = new Map<string, string[]>()
      for (const state of block) {
        const signature = dfa.alphabet
          .map((symbol) => {
            const destination = dfa.transitions[state]?.[symbol]
            return destination === undefined ? 'missing' : String(blockOf[destination])
          })
          .join('|')
        const bucket = buckets.get(signature)
        if (bucket) bucket.push(state)
        else buckets.set(signature, [state])
      }
      nextBlocks.push(...buckets.values())
    }

    const oldKey = blocks
      .map((block) => [...block].sort().join(','))
      .sort()
      .join(';')
    const newKey = nextBlocks
      .map((block) => [...block].sort().join(','))
      .sort()
      .join(';')
    blocks = nextBlocks
    if (oldKey === newKey) break
  }

  return blocks
    .map((block) => [...block].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)))
    .sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
}

export function normalizeGroups(groups: string[][]): string[][] {
  return groups
    .map((group) => [...group].sort())
    .sort((a, b) => a[0].localeCompare(b[0]))
}

export function groupsEqual(a: string[][], b: string[][]): boolean {
  return JSON.stringify(normalizeGroups(a)) === JSON.stringify(normalizeGroups(b))
}
