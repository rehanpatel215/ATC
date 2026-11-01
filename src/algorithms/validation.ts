import type { DFA, ValidationResult } from '../types/automata'
import { PAIR_SEPARATOR } from '../utils/automataHelpers'

/**
 * Validates that the input really is a complete deterministic finite automaton.
 * The table-filling method needs a total transition function, so undefined
 * transitions and dangling destinations are treated as errors, not warnings.
 */
export function validateDFA(dfa: DFA): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (dfa.states.length === 0) {
    errors.push('The DFA has no states. Add at least one state.')
  }

  const stateSet = new Set<string>()
  for (const state of dfa.states) {
    if (state.trim().length === 0) {
      errors.push('State names cannot be empty.')
      continue
    }
    if (state.includes(PAIR_SEPARATOR)) {
      errors.push(`State "${state}" contains a reserved character.`)
    }
    if (/[,()[\]]/.test(state)) {
      errors.push(`State "${state}" cannot contain commas, brackets or parentheses.`)
    }
    if (stateSet.has(state)) {
      errors.push(`The state "${state}" is defined more than once.`)
    }
    stateSet.add(state)
  }

  const alphabetSet = new Set<string>()
  for (const symbol of dfa.alphabet) {
    if (symbol.trim().length === 0) {
      errors.push('Alphabet symbols cannot be empty.')
      continue
    }
    if (alphabetSet.has(symbol)) {
      errors.push(`The alphabet symbol "${symbol}" appears more than once.`)
    }
    alphabetSet.add(symbol)
  }
  if (dfa.alphabet.length === 0) {
    errors.push('The alphabet is empty. Add at least one input symbol.')
  }

  if (!dfa.initialState) {
    errors.push('No initial state is selected.')
  } else if (!stateSet.has(dfa.initialState)) {
    errors.push(`The initial state "${dfa.initialState}" is not in the state set.`)
  }

  const finalSet = new Set<string>()
  for (const state of dfa.finalStates) {
    if (!stateSet.has(state)) {
      errors.push(`The accepting state "${state}" is not in the state set.`)
    }
    if (finalSet.has(state)) {
      errors.push(`The accepting state "${state}" is listed more than once.`)
    }
    finalSet.add(state)
  }

  // Only check transition completeness once the basics are consistent.
  if (stateSet.size === dfa.states.length && alphabetSet.size === dfa.alphabet.length) {
    for (const state of dfa.states) {
      const row = dfa.transitions[state]
      if (!row) {
        errors.push(`State "${state}" has no transition row.`)
        continue
      }
      for (const symbol of dfa.alphabet) {
        const destination = row[symbol]
        if (destination === undefined || destination === '') {
          errors.push(
            `Transition δ(${state}, ${symbol}) is undefined. Every state needs a transition for every symbol.`,
          )
        } else if (!stateSet.has(destination)) {
          errors.push(
            `Transition δ(${state}, ${symbol}) points to "${destination}", which is not a state.`,
          )
        }
      }
    }
  }

  if (errors.length === 0) {
    if (dfa.finalStates.length === 0) {
      warnings.push(
        'This DFA has no accepting states, so it accepts the empty language (∅). Minimization still works.',
      )
    }
    if (dfa.finalStates.length === dfa.states.length && dfa.states.length > 0) {
      warnings.push(
        'Every state is accepting. The minimized DFA will accept every string if all states are equivalent.',
      )
    }
  }

  const issues = [
    ...errors.map((message) => ({ severity: 'error' as const, message })),
    ...warnings.map((message) => ({ severity: 'warning' as const, message })),
  ]

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    issues,
  }
}
