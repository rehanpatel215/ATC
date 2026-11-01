import type { DFA, TransitionRef } from '../types/automata'

export interface DiscoveryStep {
  state: string
  /** The transition that discovered this state (absent for the initial state). */
  via?: TransitionRef
}

export interface ReachabilityResult {
  /** States in breadth-first discovery order, starting with the initial state. */
  reachable: string[]
  /** Reachable states filtered back into the original declaration order. */
  orderedReachable: string[]
  unreachable: string[]
  discovery: DiscoveryStep[]
}

/**
 * Breadth-first traversal from the initial state using only alphabet
 * transitions. Unreachable states are reported, not silently discarded.
 */
export function findReachable(dfa: DFA): ReachabilityResult {
  const discovery: DiscoveryStep[] = []
  const visited = new Set<string>()
  const queue: string[] = []

  if (dfa.initialState && dfa.states.includes(dfa.initialState)) {
    visited.add(dfa.initialState)
    queue.push(dfa.initialState)
    discovery.push({ state: dfa.initialState })
  }

  while (queue.length > 0) {
    const state = queue.shift() as string
    const row = dfa.transitions[state] ?? {}
    for (const symbol of dfa.alphabet) {
      const destination = row[symbol]
      if (!destination || !dfa.states.includes(destination)) continue
      if (visited.has(destination)) continue
      visited.add(destination)
      const via: TransitionRef = { from: state, symbol, to: destination }
      discovery.push({ state: destination, via })
      queue.push(destination)
    }
  }

  const reachable = discovery.map((entry) => entry.state)
  const unreachable = dfa.states.filter((state) => !visited.has(state))
  const orderedReachable = dfa.states.filter((state) => visited.has(state))

  return { reachable, orderedReachable, unreachable, discovery }
}
