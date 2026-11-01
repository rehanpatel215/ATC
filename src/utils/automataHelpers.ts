import type { DFA, Pair, PairKey, TransitionRef } from '../types/automata'

/** Separator that cannot collide with ordinary state names entered in the UI. */
export const PAIR_SEPARATOR = '\u0001'

export function cloneDFA(dfa: DFA): DFA {
  const transitions: DFA['transitions'] = {}
  for (const state of dfa.states) {
    transitions[state] = { ...(dfa.transitions[state] ?? {}) }
  }
  return {
    states: [...dfa.states],
    alphabet: [...dfa.alphabet],
    initialState: dfa.initialState,
    finalStates: [...dfa.finalStates],
    transitions,
  }
}

export function pairKey(pair: Pair): PairKey {
  return `${pair.a}${PAIR_SEPARATOR}${pair.b}`
}

export function makePair(a: string, b: string, order: Map<string, number>): Pair {
  const ai = order.get(a) ?? Number.MAX_SAFE_INTEGER
  const bi = order.get(b) ?? Number.MAX_SAFE_INTEGER
  return ai <= bi ? { a, b } : { a: b, b: a }
}

export function pairKeyFor(a: string, b: string, order: Map<string, number>): PairKey {
  return pairKey(makePair(a, b, order))
}

export function classLabel(members: string[]): string {
  return `[${members.join(',')}]`
}

export function transitionRefsForPair(
  dfa: DFA,
  pair: Pair,
  symbols: string[] = dfa.alphabet,
): TransitionRef[] {
  const refs: TransitionRef[] = []
  for (const state of [pair.a, pair.b]) {
    for (const symbol of symbols) {
      const to = dfa.transitions[state]?.[symbol]
      if (to !== undefined) refs.push({ from: state, symbol, to })
    }
  }
  return refs
}

export function uniqueRefs(refs: TransitionRef[]): TransitionRef[] {
  const seen = new Set<string>()
  return refs.filter((ref) => {
    const key = `${ref.from}${PAIR_SEPARATOR}${ref.symbol}${PAIR_SEPARATOR}${ref.to}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function nextStateName(used: Set<string>): string {
  let index = 0
  while (used.has(`q${index}`)) index += 1
  return `q${index}`
}

export function nextSymbolName(used: Set<string>): string {
  const candidates = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  for (const candidate of candidates) {
    if (!used.has(candidate)) return candidate
  }
  let index = 1
  while (used.has(`s${index}`)) index += 1
  return `s${index}`
}

export function isStateFinal(dfa: DFA, state: string): boolean {
  return dfa.finalStates.includes(state)
}

export function describeState(dfa: DFA, state: string): string {
  const parts: string[] = []
  if (state === dfa.initialState) parts.push('initial')
  if (dfa.finalStates.includes(state)) parts.push('accepting')
  return parts.length ? `${state} (${parts.join(', ')})` : `${state} (non-accepting)`
}

/** Adds a state and completes its row with transitions to the initial state. */
export function addState(dfa: DFA, name: string): DFA {
  if (dfa.states.includes(name)) return dfa
  const next = cloneDFA(dfa)
  next.states.push(name)
  next.transitions[name] = {}
  const fallback = next.initialState || name
  for (const symbol of next.alphabet) next.transitions[name][symbol] = fallback
  return next
}

export function removeState(dfa: DFA, name: string): DFA {
  if (dfa.states.length <= 1) return dfa
  const next = cloneDFA(dfa)
  next.states = next.states.filter((state) => state !== name)
  delete next.transitions[name]
  for (const state of next.states) {
    for (const symbol of next.alphabet) {
      if (next.transitions[state][symbol] === name) {
        next.transitions[state][symbol] = next.states[0]
      }
    }
  }
  if (next.initialState === name) next.initialState = next.states[0]
  next.finalStates = next.finalStates.filter((state) => state !== name)
  return next
}

export function renameState(dfa: DFA, oldName: string, newName: string): DFA {
  const trimmed = newName.trim()
  if (!trimmed || trimmed === oldName || dfa.states.includes(trimmed)) return dfa
  // Class labels are rendered as [A,B]; reserved characters would make them ambiguous.
  if (/[,()[\]]/.test(trimmed) || trimmed.includes(PAIR_SEPARATOR)) return dfa
  const next = cloneDFA(dfa)
  next.states = next.states.map((state) => (state === oldName ? trimmed : state))
  const remapped: DFA['transitions'] = {}
  for (const state of next.states) {
    const previousName = state === trimmed ? oldName : state
    const row = next.transitions[previousName] ?? {}
    remapped[state] = Object.fromEntries(
      Object.entries(row).map(([symbol, destination]) => [
        symbol,
        destination === oldName ? trimmed : destination,
      ]),
    )
  }
  next.transitions = remapped
  if (next.initialState === oldName) next.initialState = trimmed
  next.finalStates = next.finalStates.map((state) => (state === oldName ? trimmed : state))
  return next
}

export function setTransition(dfa: DFA, from: string, symbol: string, to: string): DFA {
  const next = cloneDFA(dfa)
  if (!next.transitions[from]) next.transitions[from] = {}
  next.transitions[from][symbol] = to
  return next
}

/**
 * Deleting a transition intentionally leaves the DFA incomplete so that the
 * validation layer can explain the problem instead of silently inventing a
 * destination.
 */
export function deleteTransition(dfa: DFA, from: string, symbol: string): DFA {
  const next = cloneDFA(dfa)
  if (next.transitions[from]) delete next.transitions[from][symbol]
  return next
}

export function setInitialState(dfa: DFA, state: string): DFA {
  if (!dfa.states.includes(state)) return dfa
  return { ...cloneDFA(dfa), initialState: state }
}

export function toggleFinalState(dfa: DFA, state: string): DFA {
  if (!dfa.states.includes(state)) return dfa
  const next = cloneDFA(dfa)
  next.finalStates = next.finalStates.includes(state)
    ? next.finalStates.filter((entry) => entry !== state)
    : [...next.finalStates, state]
  return next
}

export function setFinalState(dfa: DFA, state: string, isFinal: boolean): DFA {
  if (!dfa.states.includes(state)) return dfa
  const next = cloneDFA(dfa)
  const others = next.finalStates.filter((entry) => entry !== state)
  next.finalStates = isFinal ? [...others, state] : others
  return next
}

export function addSymbol(dfa: DFA, symbol: string): DFA {
  const trimmed = symbol.trim()
  if (!trimmed || dfa.alphabet.includes(trimmed)) return dfa
  const next = cloneDFA(dfa)
  next.alphabet.push(trimmed)
  const fallback = next.initialState || next.states[0]
  for (const state of next.states) {
    if (!next.transitions[state]) next.transitions[state] = {}
    next.transitions[state][trimmed] = fallback
  }
  return next
}

export function removeSymbol(dfa: DFA, symbol: string): DFA {
  if (dfa.alphabet.length <= 1) return dfa
  const next = cloneDFA(dfa)
  next.alphabet = next.alphabet.filter((entry) => entry !== symbol)
  for (const state of next.states) {
    if (next.transitions[state]) delete next.transitions[state][symbol]
  }
  return next
}

export function setSymbol(dfa: DFA, index: number, symbol: string): DFA {
  const trimmed = symbol.trim()
  const previous = dfa.alphabet[index]
  if (!previous || !trimmed || trimmed === previous || dfa.alphabet.includes(trimmed)) return dfa
  const next = cloneDFA(dfa)
  next.alphabet[index] = trimmed
  for (const state of next.states) {
    const row = next.transitions[state] ?? {}
    if (previous in row) {
      row[trimmed] = row[previous]
      delete row[previous]
    }
  }
  return next
}

export function makeEmptyDFA(): DFA {
  return {
    states: ['A'],
    alphabet: ['0', '1'],
    initialState: 'A',
    finalStates: [],
    transitions: { A: { '0': 'A', '1': 'A' } },
  }
}

export function formatSet(states: string[]): string {
  if (states.length === 0) return '∅'
  return `{${states.join(', ')}}`
}

export function formatPair(pair: Pair): string {
  return `(${pair.a}, ${pair.b})`
}

export function formatTransitions(dfa: DFA): string {
  return dfa.states
    .flatMap((state) =>
      dfa.alphabet.map(
        (symbol) => `δ(${state}, ${symbol}) = ${dfa.transitions[state]?.[symbol] ?? '—'}`,
      ),
    )
    .join('; ')
}
