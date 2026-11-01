import type { DFA } from '../types/automata'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface Challenge {
  id: string
  number: number
  title: string
  difficulty: Difficulty
  tagline: string
  description: string
  objective: string
  hint: string
  dfa: DFA
  /** Independently verified answers used by the solution panel and tests. */
  expected: {
    minimizedStates: number
    groups: string[][]
    reachable: number
    unreachable: number
    acceptingStates: number
    minimizedAcceptingStates: number
    minMarkingRounds: number
  }
}

/**
 * Six genuinely different DFAs, all over {0,1}. Every expected answer below is
 * asserted by src/tests/challenges.test.ts against the table-filling result and
 * against an independent partition-refinement implementation.
 */
export const CHALLENGES: Challenge[] = [
  {
    id: 'q1',
    number: 1,
    title: 'One Redundant Twin',
    difficulty: 'Easy',
    tagline: 'A single indistinguishable pair',
    description:
      'States A and B are non-accepting and behave identically for every future input. The accepting state C and the sink state D are genuinely different.',
    objective:
      'Practise the initial final/non-final marking and see one equivalence class emerge from a pair that is never marked.',
    hint: 'Start by marking every pair that contains C. Then compare the destinations of (A, B) on 0 and 1.',
    dfa: {
      states: ['A', 'B', 'C', 'D'],
      alphabet: ['0', '1'],
      initialState: 'A',
      finalStates: ['C'],
      transitions: {
        A: { '0': 'B', '1': 'C' },
        B: { '0': 'A', '1': 'C' },
        C: { '0': 'D', '1': 'C' },
        D: { '0': 'D', '1': 'D' },
      },
    },
    expected: {
      minimizedStates: 3,
      groups: [['A', 'B'], ['C'], ['D']],
      reachable: 4,
      unreachable: 0,
      acceptingStates: 1,
      minimizedAcceptingStates: 1,
      minMarkingRounds: 1,
    },
  },
  {
    id: 'q2',
    number: 2,
    title: 'Two Pairs, One Pattern',
    difficulty: 'Easy',
    tagline: 'Two independent equivalence classes',
    description:
      'This DFA contains two separate duplicate pairs: A with B, and C with D. The accepting state E is unique.',
    objective:
      'Observe that several unmarked pairs can survive the table at the same time, and that each becomes its own group.',
    hint: 'Pairs (A, B) and (C, D) depend on each other. Check whether any symbol ever sends one of those pairs into a marked pair.',
    dfa: {
      states: ['A', 'B', 'C', 'D', 'E'],
      alphabet: ['0', '1'],
      initialState: 'A',
      finalStates: ['E'],
      transitions: {
        A: { '0': 'B', '1': 'C' },
        B: { '0': 'A', '1': 'D' },
        C: { '0': 'A', '1': 'E' },
        D: { '0': 'B', '1': 'E' },
        E: { '0': 'A', '1': 'E' },
      },
    },
    expected: {
      minimizedStates: 3,
      groups: [['A', 'B'], ['C', 'D'], ['E']],
      reachable: 5,
      unreachable: 0,
      acceptingStates: 1,
      minimizedAcceptingStates: 1,
      minMarkingRounds: 1,
    },
  },
  {
    id: 'q3',
    number: 3,
    title: 'The Ripple Effect',
    difficulty: 'Medium',
    tagline: 'Distinguishability travels through the table',
    description:
      'States D and E are duplicate accepting states. The other pairs are decided only after earlier marks propagate through the table, so one pass is not enough.',
    objective:
      'Follow multiple refinement rounds and understand why the algorithm must continue until a complete pass adds no new marks.',
    hint: 'Round 1 decides pairs that point straight into an accepting/non-accepting pair. Later rounds use those new marks.',
    dfa: {
      states: ['A', 'B', 'C', 'D', 'E'],
      alphabet: ['0', '1'],
      initialState: 'A',
      finalStates: ['D', 'E'],
      transitions: {
        A: { '0': 'A', '1': 'B' },
        B: { '0': 'A', '1': 'C' },
        C: { '0': 'A', '1': 'D' },
        D: { '0': 'A', '1': 'E' },
        E: { '0': 'A', '1': 'D' },
      },
    },
    expected: {
      minimizedStates: 4,
      groups: [['A'], ['B'], ['C'], ['D', 'E']],
      reachable: 5,
      unreachable: 0,
      acceptingStates: 2,
      minimizedAcceptingStates: 1,
      minMarkingRounds: 2,
    },
  },
  {
    id: 'q4',
    number: 4,
    title: 'Ghost States',
    difficulty: 'Medium',
    tagline: 'Remove what cannot be reached',
    description:
      'U and V can never be entered from the initial state A. They are deliberately shaped to look equivalent to D and C, which makes them a trap for a careless implementation.',
    objective:
      'See why reachability must be checked before pairing states, and why unreachable states must not appear in equivalence groups.',
    hint: 'Run the reachability animation first. Only A, B, C and D should remain in the pair table.',
    dfa: {
      states: ['A', 'B', 'C', 'D', 'U', 'V'],
      alphabet: ['0', '1'],
      initialState: 'A',
      finalStates: ['C', 'V'],
      transitions: {
        A: { '0': 'B', '1': 'C' },
        B: { '0': 'A', '1': 'C' },
        C: { '0': 'D', '1': 'C' },
        D: { '0': 'D', '1': 'D' },
        U: { '0': 'U', '1': 'U' },
        V: { '0': 'U', '1': 'V' },
      },
    },
    expected: {
      minimizedStates: 3,
      groups: [['A', 'B'], ['C'], ['D']],
      reachable: 4,
      unreachable: 2,
      acceptingStates: 2,
      minimizedAcceptingStates: 1,
      minMarkingRounds: 1,
    },
  },
  {
    id: 'q5',
    number: 5,
    title: 'Cycle Clones',
    difficulty: 'Hard',
    tagline: 'Four hidden groups, two accepting',
    description:
      'This automaton counts input length modulo 4, and every one of its four states is duplicated. Four equivalence classes survive the table, and two of them are accepting.',
    objective:
      'Handle multiple accepting and non-accepting states, and verify that every duplicate pair stays unmarked while all other pairs become distinguishable.',
    hint: 'The duplicate pairs should all remain unmarked. Cross pairs are usually separated by a short input that reaches an accepting state from one side only.',
    dfa: {
      states: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      alphabet: ['0', '1'],
      initialState: 'A',
      finalStates: ['A', 'B', 'C', 'D'],
      transitions: {
        A: { '0': 'C', '1': 'D' },
        B: { '0': 'D', '1': 'C' },
        C: { '0': 'E', '1': 'F' },
        D: { '0': 'F', '1': 'E' },
        E: { '0': 'G', '1': 'H' },
        F: { '0': 'H', '1': 'G' },
        G: { '0': 'A', '1': 'B' },
        H: { '0': 'B', '1': 'A' },
      },
    },
    expected: {
      minimizedStates: 4,
      groups: [
        ['A', 'B'],
        ['C', 'D'],
        ['E', 'F'],
        ['G', 'H'],
      ],
      reachable: 8,
      unreachable: 0,
      acceptingStates: 4,
      minimizedAcceptingStates: 2,
      minMarkingRounds: 1,
    },
  },
  {
    id: 'q6',
    number: 6,
    title: 'Pattern Recognition',
    difficulty: 'Hard',
    tagline: 'Clones, ghosts and four refinement rounds',
    description:
      'A substring detector for 1011 with two duplicated states and three unreachable states. The table needs several rounds to separate the ordinary states while leaving the clones equivalent.',
    objective:
      'Combine everything: reachability pruning, long marking chains, duplicate states and a reliable final quotient automaton.',
    hint: 'Ignore U1, U2 and U3 entirely. Focus on whether S0/S0b and S4/S4b can ever be separated.',
    dfa: {
      states: ['S0', 'S0b', 'S1', 'S2', 'S3', 'S4', 'S4b', 'U1', 'U2', 'U3'],
      alphabet: ['0', '1'],
      initialState: 'S0',
      finalStates: ['S4', 'S4b', 'U3'],
      transitions: {
        S0: { '0': 'S0b', '1': 'S1' },
        S0b: { '0': 'S0', '1': 'S1' },
        S1: { '0': 'S2', '1': 'S1' },
        S2: { '0': 'S0', '1': 'S3' },
        S3: { '0': 'S2', '1': 'S4b' },
        S4: { '0': 'S4', '1': 'S4b' },
        S4b: { '0': 'S4b', '1': 'S4' },
        U1: { '0': 'U1', '1': 'U2' },
        U2: { '0': 'U3', '1': 'U2' },
        U3: { '0': 'U3', '1': 'U1' },
      },
    },
    expected: {
      minimizedStates: 5,
      groups: [['S0', 'S0b'], ['S1'], ['S2'], ['S3'], ['S4', 'S4b']],
      reachable: 7,
      unreachable: 3,
      acceptingStates: 3,
      minimizedAcceptingStates: 1,
      minMarkingRounds: 3,
    },
  },
]

export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id)
}
