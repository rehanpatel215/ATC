import type { DFA } from '../types/automata'

/** Runs the DFA from a given state and returns the state reached after the input. */
export function runDFA(dfa: DFA, startState: string, input: string): string | null {
  let current = startState
  for (const symbol of [...input]) {
    const next = dfa.transitions[current]?.[symbol]
    if (next === undefined) return null
    current = next
  }
  return current
}

export function acceptsFrom(dfa: DFA, startState: string, input: string): boolean {
  const end = runDFA(dfa, startState, input)
  return end !== null && dfa.finalStates.includes(end)
}

export function enumerateStrings(alphabet: string[], maxLength: number): string[] {
  const result: string[] = ['']
  let frontier: string[] = ['']
  for (let length = 1; length <= maxLength; length += 1) {
    const next: string[] = []
    for (const prefix of frontier) {
      for (const symbol of alphabet) next.push(prefix + symbol)
    }
    result.push(...next)
    frontier = next
  }
  return result
}

export interface DistinguishingWitness {
  input: string
  acceptedFromA: boolean
  acceptedFromB: boolean
}

/**
 * Breadth-first search in the product automaton, returning a shortest string
 * that is accepted from exactly one of the two states. Returns null when no
 * such string exists (which means the states are equivalent).
 */
export function shortestDistinguishingString(
  dfa: DFA,
  stateA: string,
  stateB: string,
): DistinguishingWitness | null {
  const startA = stateA
  const startB = stateB
  const initialAcceptedA = dfa.finalStates.includes(startA)
  const initialAcceptedB = dfa.finalStates.includes(startB)
  if (initialAcceptedA !== initialAcceptedB) {
    return { input: '', acceptedFromA: initialAcceptedA, acceptedFromB: initialAcceptedB }
  }

  const keyOf = (a: string, b: string) => (a <= b ? `${a}\u0001${b}` : `${b}\u0001${a}`)
  const visited = new Set<string>([keyOf(startA, startB)])
  type Node = { a: string; b: string; input: string }
  const queue: Node[] = [{ a: startA, b: startB, input: '' }]

  while (queue.length > 0) {
    const node = queue.shift() as Node
    for (const symbol of dfa.alphabet) {
      const nextA = dfa.transitions[node.a]?.[symbol]
      const nextB = dfa.transitions[node.b]?.[symbol]
      if (nextA === undefined || nextB === undefined) continue
      const input = node.input + symbol
      const acceptedA = dfa.finalStates.includes(nextA)
      const acceptedB = dfa.finalStates.includes(nextB)
      if (acceptedA !== acceptedB) {
        return { input, acceptedFromA: acceptedA, acceptedFromB: acceptedB }
      }
      const key = keyOf(nextA, nextB)
      if (visited.has(key)) continue
      visited.add(key)
      queue.push({ a: nextA, b: nextB, input })
    }
  }

  return null
}

export interface EquivalenceCheck {
  ok: boolean
  checked: number
  failure?: {
    startState: string
    minimizedState: string | null
    input: string
    originalAccepted: boolean
    minimizedAccepted: boolean
  }
}

/**
 * Cross-checks the quotient automaton against the original for every reachable
 * start state and every input up to `maxLength`. This is a sanity check that
 * complements (never replaces) the mathematical argument.
 */
export function verifyMinimizedEquivalence(
  original: DFA,
  minimized: DFA,
  stateToClass: Record<string, string>,
  reachableStates: string[],
  maxLength = 6,
): EquivalenceCheck {
  const inputs = enumerateStrings(original.alphabet, maxLength)
  let checked = 0

  for (const startState of reachableStates) {
    const minimizedState = stateToClass[startState] ?? null
    for (const input of inputs) {
      const originalAccepted = acceptsFrom(original, startState, input)
      const minimizedAccepted =
        minimizedState === null ? false : acceptsFrom(minimized, minimizedState, input)
      checked += 1
      if (originalAccepted !== minimizedAccepted) {
        return {
          ok: false,
          checked,
          failure: {
            startState,
            minimizedState,
            input,
            originalAccepted,
            minimizedAccepted,
          },
        }
      }
    }
  }

  return { ok: true, checked }
}

export interface GroupCheck {
  ok: boolean
  checkedPairs: number
  issues: string[]
}

/**
 * Independent witness-based check of the equivalence classes:
 * every same-class pair must have no distinguishing string, and every
 * different-class pair must have one.
 */
export function verifyEquivalenceGroups(
  dfa: DFA,
  groups: string[][],
): GroupCheck {
  const issues: string[] = []
  let checkedPairs = 0
  const groupOf = new Map<string, number>()
  groups.forEach((members, index) => members.forEach((member) => groupOf.set(member, index)))

  for (let i = 0; i < groups.length; i += 1) {
    for (let j = 0; j < groups[i].length; j += 1) {
      for (let k = j + 1; k < groups[i].length; k += 1) {
        checkedPairs += 1
        const witness = shortestDistinguishingString(dfa, groups[i][j], groups[i][k])
        if (witness) {
          issues.push(
            `${groups[i][j]} and ${groups[i][k]} were merged but are distinguished by "${witness.input || 'ε'}".`,
          )
        }
      }
    }
  }

  for (let i = 0; i < groups.length; i += 1) {
    for (let j = i + 1; j < groups.length; j += 1) {
      for (const a of groups[i]) {
        for (const b of groups[j]) {
          checkedPairs += 1
          const witness = shortestDistinguishingString(dfa, a, b)
          if (!witness) {
            issues.push(
              `${a} and ${b} are in different groups but no string distinguishes them.`,
            )
          }
        }
      }
    }
  }

  // Keeps TypeScript honest about the map being used for a consistency check.
  if (groupOf.size !== groups.reduce((total, members) => total + members.length, 0)) {
    issues.push('A state appears in more than one equivalence group.')
  }

  return { ok: issues.length === 0, checkedPairs, issues }
}
