import type { DFA } from '../types/automata'

/**
 * Default DFA used when the simulator opens. It contains two merged pairs and
 * a non-accepting sink, so the first walkthrough immediately shows a reduction.
 */
export const STARTER_DFA: DFA = {
  states: ['A', 'B', 'C', 'D', 'E'],
  alphabet: ['0', '1'],
  initialState: 'A',
  finalStates: ['C', 'D'],
  transitions: {
    A: { '0': 'B', '1': 'C' },
    B: { '0': 'A', '1': 'D' },
    C: { '0': 'B', '1': 'E' },
    D: { '0': 'A', '1': 'E' },
    E: { '0': 'E', '1': 'E' },
  },
}

export const STARTER_DESCRIPTION =
  'Two non-accepting states (A, B) and two accepting states (C, D) are duplicates. Minimization should collapse them into three states.'

/** The classic four-state example from the specification. */
export const SPEC_EXAMPLE_DFA: DFA = {
  states: ['A', 'B', 'C', 'D'],
  alphabet: ['0', '1'],
  initialState: 'A',
  finalStates: ['D'],
  transitions: {
    A: { '0': 'B', '1': 'C' },
    B: { '0': 'A', '1': 'D' },
    C: { '0': 'D', '1': 'A' },
    D: { '0': 'C', '1': 'B' },
  },
}
