/**
 * Core automata types shared by the algorithm layer and the UI.
 *
 * Internal representation: a complete DFA whose transition function is stored
 * as `transitions[state][symbol] = destination`.
 */
export interface DFA {
  states: string[]
  alphabet: string[]
  initialState: string
  finalStates: string[]
  transitions: Record<string, Record<string, string>>
}

export interface TransitionRef {
  from: string
  symbol: string
  to: string
}

/** A canonical, unordered pair. `a` precedes `b` in the working state order. */
export interface Pair {
  a: string
  b: string
}

export type PairKey = string

export interface PairRecord extends Pair {
  key: PairKey
}

export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  issues: ValidationIssue[]
}

export interface EquivalenceGroup {
  name: string
  members: string[]
  isInitial: boolean
  isFinal: boolean
  /** Stable palette index used by the graphs (colour + textual badge). */
  colorIndex: number
}

export interface MinimizedDFA extends DFA {
  groups: EquivalenceGroup[]
  /** Maps every original (reachable) state to the name of its group. */
  stateToClass: Record<string, string>
}

/** Optional metadata attached to an educational DFA example. */
export interface ExampleDFA {
  name: string
  description: string
  dfa: DFA
}
