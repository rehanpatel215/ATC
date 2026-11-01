import { describe, expect, it } from 'vitest'
import type { DFA } from '../types/automata'
import { analyzeDFA } from '../algorithms/analyze'
import { validateDFA } from '../algorithms/validation'
import { findReachable } from '../algorithms/reachability'
import { runTableFilling } from '../algorithms/tableFilling'
import {
  shortestDistinguishingString,
  verifyEquivalenceGroups,
  verifyMinimizedEquivalence,
} from '../algorithms/verification'
import { SPEC_EXAMPLE_DFA, STARTER_DFA } from '../data/starter'
import { groupsEqual, referenceMinimize } from './reference'

function ok(dfa: DFA) {
  const analysis = analyzeDFA(dfa)
  expect(analysis.valid).toBe(true)
  expect(analysis.minimized).not.toBeNull()
  return analysis
}

const twoEquivalent: DFA = {
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
}

const multipleEquivalent: DFA = {
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
}

const withUnreachable: DFA = {
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
}

const allEquivalent: DFA = {
  states: ['A', 'B'],
  alphabet: ['0', '1'],
  initialState: 'A',
  finalStates: ['A', 'B'],
  transitions: {
    A: { '0': 'B', '1': 'B' },
    B: { '0': 'A', '1': 'A' },
  },
}

const selfLoops: DFA = {
  states: ['A', 'B', 'C'],
  alphabet: ['0', '1'],
  initialState: 'A',
  finalStates: ['C'],
  transitions: {
    A: { '0': 'B', '1': 'C' },
    B: { '0': 'B', '1': 'C' },
    C: { '0': 'C', '1': 'C' },
  },
}

const unary: DFA = {
  states: ['X', 'Y', 'Z'],
  alphabet: ['a'],
  initialState: 'X',
  finalStates: ['Z'],
  transitions: {
    X: { a: 'Y' },
    Y: { a: 'X' },
    Z: { a: 'Z' },
  },
}

const ternary: DFA = {
  states: ['P', 'Q', 'R'],
  alphabet: ['a', 'b', 'c'],
  initialState: 'P',
  finalStates: ['R'],
  transitions: {
    P: { a: 'Q', b: 'P', c: 'R' },
    Q: { a: 'Q', b: 'Q', c: 'Q' },
    R: { a: 'R', b: 'R', c: 'R' },
  },
}

describe('DFA validation', () => {
  it('accepts a complete DFA', () => {
    expect(validateDFA(SPEC_EXAMPLE_DFA).valid).toBe(true)
  })

  it('reports an undefined transition', () => {
    const broken: DFA = {
      ...twoEquivalent,
      transitions: {
        ...twoEquivalent.transitions,
        B: { '0': 'A' },
      },
    }
    const result = validateDFA(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('δ(B, 1) is undefined')
  })

  it('reports a transition to a missing state', () => {
    const broken: DFA = {
      ...twoEquivalent,
      transitions: { ...twoEquivalent.transitions, A: { '0': 'Z', '1': 'C' } },
    }
    expect(validateDFA(broken).errors.join(' ')).toContain('not a state')
  })

  it('reports duplicate state names, duplicate symbols and a bad initial state', () => {
    const broken: DFA = {
      ...twoEquivalent,
      states: ['A', 'A', 'B'],
      alphabet: ['0', '0'],
      initialState: 'Q',
      finalStates: ['X'],
    }
    const result = validateDFA(broken)
    expect(result.valid).toBe(false)
    expect(result.errors.join(' ')).toContain('defined more than once')
    expect(result.errors.join(' ')).toContain('appears more than once')
    expect(result.errors.join(' ')).toContain('initial state "Q"')
    expect(result.errors.join(' ')).toContain('accepting state "X"')
  })

  it('returns a single explanatory step for an invalid DFA', () => {
    const broken: DFA = {
      ...twoEquivalent,
      alphabet: [],
    }
    const analysis = analyzeDFA(broken)
    expect(analysis.valid).toBe(false)
    expect(analysis.steps).toHaveLength(1)
    expect(analysis.steps[0].kind).toBe('validation')
    expect(analysis.steps[0].title).toContain('failed')
    expect(analysis.steps[0].bullets?.length).toBeGreaterThan(0)
    expect(analysis.minimized).toBeNull()
  })
})

describe('reachability', () => {
  it('separates reachable and unreachable states without losing order', () => {
    const result = findReachable(withUnreachable)
    expect(result.reachable).toEqual(['A', 'B', 'C', 'D'])
    expect(result.orderedReachable).toEqual(['A', 'B', 'C', 'D'])
    expect(result.unreachable).toEqual(['U', 'V'])
    expect(result.discovery.map((entry) => entry.state)).toEqual(['A', 'B', 'C', 'D'])
    expect(result.discovery[1].via).toEqual({ from: 'A', symbol: '0', to: 'B' })
  })

  it('never includes unreachable states in pairs or equivalence groups', () => {
    const analysis = ok(withUnreachable)
    expect(analysis.orderedReachable).toEqual(['A', 'B', 'C', 'D'])
    expect(analysis.pairs).toHaveLength(6)
    expect(analysis.pairs.some((pair) => pair.a === 'U' || pair.b === 'U')).toBe(false)
    expect(analysis.groups.flat()).not.toContain('U')
    expect(analysis.groups.flat()).not.toContain('V')
    expect(analysis.groups).toEqual([['A', 'B'], ['C'], ['D']])
    expect(analysis.minimized?.states).toHaveLength(3)
    expect(analysis.minimized?.finalStates).toEqual(['[C]'])
    // U behaves exactly like D and V like C. They are still removed first.
    expect(shortestDistinguishingString(withUnreachable, 'U', 'D')).toBeNull()
    expect(shortestDistinguishingString(withUnreachable, 'V', 'C')).toBeNull()
  })

  it('records an explicit removal step', () => {
    const analysis = ok(withUnreachable)
    const removal = analysis.steps.find((step) => step.kind === 'remove-unreachable')
    expect(removal).toBeDefined()
    expect(removal?.fadeUnreachable).toBe(true)
    expect(removal?.bullets?.join(' ')).toContain('U')
  })
})

describe('table filling — marking', () => {
  it('marks every pair of the classic four-state DFA', () => {
    const analysis = ok(SPEC_EXAMPLE_DFA)
    expect(analysis.pairs).toHaveLength(6)
    expect(Object.keys(analysis.marked)).toHaveLength(6)
    expect(analysis.equivalentPairs).toHaveLength(0)
    expect(analysis.groups).toEqual([['A'], ['B'], ['C'], ['D']])
    expect(analysis.minimized?.states).toHaveLength(4)
    expect(analysis.markingRounds).toBeGreaterThanOrEqual(1)
  })

  it('merges exactly one pair', () => {
    const analysis = ok(twoEquivalent)
    expect(analysis.orderedReachable).toEqual(['A', 'B', 'C', 'D'])
    expect(analysis.pairs).toHaveLength(6)
    expect(analysis.groups).toEqual([['A', 'B'], ['C'], ['D']])
    expect(analysis.marked[analysis.pairIndex['A\u0001B'].key]).toBeUndefined()
    expect(analysis.marked[analysis.pairIndex['C\u0001D'].key].reason).toBe('finality')
    expect(analysis.minimized?.states).toEqual(['[A,B]', '[C]', '[D]'])
    expect(analysis.minimized?.initialState).toBe('[A,B]')
    expect(analysis.minimized?.finalStates).toEqual(['[C]'])
    expect(analysis.minimized?.transitions).toEqual({
      '[A,B]': { '0': '[A,B]', '1': '[C]' },
      '[C]': { '0': '[D]', '1': '[C]' },
      '[D]': { '0': '[D]', '1': '[D]' },
    })
  })

  it('finds four duplicate clone pairs without marking them', () => {
    const analysis = ok(multipleEquivalent)
    expect(analysis.groups).toEqual([
      ['A', 'B'],
      ['C', 'D'],
      ['E', 'F'],
      ['G', 'H'],
    ])
    expect(analysis.minimized?.states).toHaveLength(4)
    expect(analysis.minimized?.finalStates).toHaveLength(2)
    expect(analysis.marked['A\u0001B']).toBeUndefined()
    expect(analysis.marked['C\u0001D']).toBeUndefined()
    expect(analysis.marked['E\u0001F']).toBeUndefined()
    expect(analysis.marked['G\u0001H']).toBeUndefined()
  })

  it('supports a DFA where every state is equivalent', () => {
    const analysis = ok(allEquivalent)
    expect(analysis.pairs).toHaveLength(1)
    expect(analysis.marked).toEqual({})
    expect(analysis.groups).toEqual([['A', 'B']])
    expect(analysis.minimized?.states).toHaveLength(1)
    expect(analysis.minimized?.finalStates).toEqual(['[A,B]'])
    expect(analysis.minimized?.transitions['[A,B]']).toEqual({
      '0': '[A,B]',
      '1': '[A,B]',
    })
  })

  it('handles self-loops and identical destinations', () => {
    const analysis = ok(selfLoops)
    expect(analysis.groups).toEqual([['A', 'B'], ['C']])
    expect(analysis.minimized?.states).toHaveLength(2)
    expect(analysis.minimized?.transitions['[A,B]']).toEqual({
      '0': '[A,B]',
      '1': '[C]',
    })
  })

  it('handles a one-symbol alphabet and removes its unreachable state', () => {
    const analysis = ok(unary)
    expect(analysis.reachable).toEqual(['X', 'Y'])
    expect(analysis.unreachable).toEqual(['Z'])
    expect(analysis.pairs).toHaveLength(1)
    expect(analysis.groups).toEqual([['X', 'Y']])
    expect(analysis.minimized?.states).toEqual(['[X,Y]'])
    expect(analysis.minimized?.finalStates).toEqual([])
  })

  it('handles a three-symbol alphabet', () => {
    const analysis = ok(ternary)
    expect(analysis.pairs).toHaveLength(3)
    expect(analysis.groups).toEqual([['P'], ['Q'], ['R']])
    expect(analysis.minimized?.transitions['[P]']).toEqual({
      a: '[Q]',
      b: '[P]',
      c: '[R]',
    })
  })

  it('requires several refinement rounds and keeps stepping to a fixed point', () => {
    const analysis = ok(multipleEquivalent)
    expect(analysis.markingRounds).toBeGreaterThanOrEqual(1)
    const terminalRound = analysis.rounds[analysis.rounds.length - 1]
    expect(terminalRound.newlyMarked).toHaveLength(0)
    const roundSteps = analysis.steps.filter((step) => step.kind === 'round-start')
    expect(roundSteps.length).toBe(analysis.rounds.length)
    expect(analysis.steps.at(-1)?.kind).toBe('done')
  })

  it('keeps a cumulative, monotone marked snapshot across steps', () => {
    const analysis = ok(multipleEquivalent)
    let previous = 0
    for (const step of analysis.steps) {
      expect(step.markedSoFar.length).toBeGreaterThanOrEqual(previous)
      expect(new Set(step.markedSoFar).size).toBe(step.markedSoFar.length)
      previous = step.markedSoFar.length
    }
    const totalMarked = analysis.pairs.length - analysis.equivalentPairs.length
    expect(previous).toBe(totalMarked)
  })

  it('does not mark a pair when destinations are identical or still unmarked', () => {
    const dfa: DFA = {
      states: ['A', 'B', 'C'],
      alphabet: ['0', '1'],
      initialState: 'A',
      finalStates: ['C'],
      transitions: {
        A: { '0': 'C', '1': 'A' },
        B: { '0': 'A', '1': 'B' },
        C: { '0': 'C', '1': 'C' },
      },
    }
    const table = runTableFilling({
      states: dfa.states,
      alphabet: dfa.alphabet,
      transitions: dfa.transitions,
      finalStates: dfa.finalStates,
    })
    const ab = table.pairIndex['A\u0001B']
    expect(table.marked[ab.key]).toBeDefined()
    // On 0: A -> C (final), B -> A (non-final): a marked destination pair.
    expect(table.marked[ab.key].via?.symbol).toBe('0')
    expect(table.marked[ab.key].via?.destPair).toEqual({ a: 'A', b: 'C' })
  })
})

describe('equivalence and minimization correctness', () => {
  const cases: Array<[string, DFA]> = [
    ['starter', STARTER_DFA],
    ['spec example', SPEC_EXAMPLE_DFA],
    ['one merge', twoEquivalent],
    ['four merges', multipleEquivalent],
    ['unreachable', withUnreachable],
    ['all equivalent', allEquivalent],
    ['self loops', selfLoops],
    ['unary', unary],
    ['ternary', ternary],
  ]

  for (const [name, dfa] of cases) {
    it(`matches an independent partition refinement for ${name}`, () => {
      const analysis = ok(dfa)
      expect(groupsEqual(analysis.groups, referenceMinimize(dfa))).toBe(true)
    })

    it(`builds a consistent quotient for ${name}`, () => {
      const analysis = ok(dfa)
      expect(analysis.build?.consistent).toBe(true)
      expect(analysis.build?.inconsistencies).toEqual([])
      expect(analysis.minimized?.states).toHaveLength(analysis.groups.length)
      const flattened = analysis.minimized?.states.flatMap((state) => state) ?? []
      expect(flattened.length).toBeGreaterThan(0)
    })

    it(`verifies all marked and unmarked pairs with witnesses for ${name}`, () => {
      const analysis = ok(dfa)
      for (const pair of analysis.pairs) {
        const witness = shortestDistinguishingString(dfa, pair.a, pair.b)
        if (analysis.marked[pair.key]) {
          expect(witness, `${pair.a},${pair.b} marked without witness`).not.toBeNull()
        } else {
          expect(witness, `${pair.a},${pair.b} unmarked but distinguishable`).toBeNull()
        }
      }
      expect(verifyEquivalenceGroups(dfa, analysis.groups).ok).toBe(true)
    })

    it(`verifies language equivalence of the quotient for ${name}`, () => {
      const analysis = ok(dfa)
      const check = verifyMinimizedEquivalence(
        dfa,
        analysis.minimized as DFA,
        analysis.minimized?.stateToClass ?? {},
        analysis.orderedReachable,
        5,
      )
      expect(check.ok, JSON.stringify(check.failure)).toBe(true)
      const alphabetSize = dfa.alphabet.length
      const stringsPerState = Array.from({ length: 6 }, (_, index) => alphabetSize ** index).reduce(
        (total, value) => total + value,
        0,
      )
      expect(check.checked).toBe(analysis.orderedReachable.length * stringsPerState)
    })
  }

  it('detects a corrupted minimized transition', () => {
    const analysis = ok(twoEquivalent)
    const corrupted: DFA = {
      ...(analysis.minimized as DFA),
      transitions: {
        ...(analysis.minimized as DFA).transitions,
        '[C]': { '0': '[C]', '1': '[C]' },
      },
    }
    const check = verifyMinimizedEquivalence(
      twoEquivalent,
      corrupted,
      analysis.minimized?.stateToClass ?? {},
      analysis.orderedReachable,
      4,
    )
    expect(check.ok).toBe(false)
    expect(check.failure?.startState).toBeDefined()
  })
})
