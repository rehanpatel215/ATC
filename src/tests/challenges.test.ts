import { describe, expect, it } from 'vitest'
import type { DFA } from '../types/automata'
import { analyzeDFA } from '../algorithms/analyze'
import { runTableFilling } from '../algorithms/tableFilling'
import { verifyEquivalenceGroups, verifyMinimizedEquivalence } from '../algorithms/verification'
import { CHALLENGES } from '../data/challenges'
import { groupsEqual, referenceMinimize } from './reference'

describe('predefined practice challenges', () => {
  it('contains exactly six distinct challenges in the required difficulty order', () => {
    expect(CHALLENGES).toHaveLength(6)
    expect(CHALLENGES.map((challenge) => challenge.difficulty)).toEqual([
      'Easy',
      'Easy',
      'Medium',
      'Medium',
      'Hard',
      'Hard',
    ])
    const serialized = CHALLENGES.map((challenge) => JSON.stringify(challenge.dfa))
    expect(new Set(serialized).size).toBe(6)
    for (const challenge of CHALLENGES) {
      expect(challenge.dfa.alphabet).toEqual(['0', '1'])
      expect(challenge.dfa.states.length).toBeGreaterThanOrEqual(4)
      expect(challenge.objective.length).toBeGreaterThan(20)
    }
  })

  for (const challenge of CHALLENGES) {
    describe(`Q${challenge.number} — ${challenge.title}`, () => {
      const analysis = analyzeDFA(challenge.dfa)

      it('is a valid complete DFA', () => {
        expect(analysis.valid).toBe(true)
        expect(analysis.validation.errors).toEqual([])
      })

      it('has the expected reachable and unreachable state counts', () => {
        expect(analysis.reachable).toHaveLength(challenge.expected.reachable)
        expect(analysis.unreachable).toHaveLength(challenge.expected.unreachable)
        expect(analysis.orderedReachable.length + analysis.unreachable.length).toBe(
          challenge.dfa.states.length,
        )
      })

      it('has the expected equivalence groups', () => {
        expect(analysis.groups).toEqual(challenge.expected.groups)
        expect(groupsEqual(analysis.groups, referenceMinimize(challenge.dfa))).toBe(true)
      })

      it('has the expected minimized state counts', () => {
        expect(analysis.minimized?.states).toHaveLength(challenge.expected.minimizedStates)
        expect(analysis.minimized?.finalStates).toHaveLength(
          challenge.expected.minimizedAcceptingStates,
        )
        expect(challenge.dfa.finalStates).toHaveLength(challenge.expected.acceptingStates)
        expect(analysis.groups).toHaveLength(challenge.expected.minimizedStates)
      })

      it('needs at least the advertised number of refinement rounds', () => {
        expect(analysis.markingRounds).toBeGreaterThanOrEqual(
          challenge.expected.minMarkingRounds,
        )
        expect(analysis.rounds.at(-1)?.newlyMarked).toHaveLength(0)
      })

      it('builds a consistent quotient with correct transitions', () => {
        expect(analysis.build?.consistent).toBe(true)
        const minimized = analysis.minimized as DFA
        for (const state of minimized.states) {
          for (const symbol of minimized.alphabet) {
            expect(minimized.transitions[state][symbol]).toBeDefined()
            expect(minimized.states).toContain(minimized.transitions[state][symbol])
          }
        }
        expect(minimized.states).toContain(minimized.initialState)
        for (const finalState of minimized.finalStates) {
          expect(minimized.states).toContain(finalState)
        }
      })

      it('passes witness-based group verification', () => {
        const check = verifyEquivalenceGroups(challenge.dfa, analysis.groups)
        expect(check.ok, check.issues.join(' ')).toBe(true)
        expect(check.checkedPairs).toBeGreaterThan(0)
      })

      it('is language-equivalent to its minimized DFA from every reachable state', () => {
        const check = verifyMinimizedEquivalence(
          challenge.dfa,
          analysis.minimized as DFA,
          analysis.minimized?.stateToClass ?? {},
          analysis.orderedReachable,
          5,
        )
        expect(check.ok, JSON.stringify(check.failure)).toBe(true)
        const stringsPerState = Array.from(
          { length: 6 },
          (_, index) => challenge.dfa.alphabet.length ** index,
        ).reduce((total, value) => total + value, 0)
        expect(check.checked).toBe(analysis.orderedReachable.length * stringsPerState)
      })

      it('produces a complete, ordered walkthrough', () => {
        expect(analysis.steps.length).toBeGreaterThan(8)
        expect(analysis.steps[0].kind).toBe('validation')
        expect(analysis.steps.at(-1)?.kind).toBe('done')
        expect(analysis.lastStepIndex).toBe(analysis.steps.length - 1)
        expect(analysis.pairsStepIndex).toBeGreaterThan(0)
        expect(analysis.steps[analysis.pairsStepIndex].kind).toBe('pairs')
        const markedAtEnd = analysis.steps.at(-1)?.markedSoFar.length
        expect(markedAtEnd).toBe(analysis.pairs.length - analysis.equivalentPairs.length)
        for (const step of analysis.steps) {
          expect(step.title.length).toBeGreaterThan(0)
          expect(step.what.length).toBeGreaterThan(0)
          expect(step.why.length).toBeGreaterThan(0)
          expect(step.operation.length).toBeGreaterThan(0)
          expect(step.result.length).toBeGreaterThan(0)
        }
      })
    })
  }

  it('Q3 and Q6 genuinely require multiple marking rounds', () => {
    const q3 = analyzeDFA(CHALLENGES[2].dfa)
    const q6 = analyzeDFA(CHALLENGES[5].dfa)
    expect(q3.markingRounds).toBeGreaterThanOrEqual(2)
    expect(q6.markingRounds).toBeGreaterThanOrEqual(3)
  })

  it('Q4 removes ghosts before forming groups', () => {
    const q4 = analyzeDFA(CHALLENGES[3].dfa)
    expect(q4.unreachable.sort()).toEqual(['U', 'V'])
    expect(q4.groups.flat()).toEqual(['A', 'B', 'C', 'D'])
    const removalIndex = q4.steps.findIndex((step) => step.kind === 'remove-unreachable')
    const pairsIndex = q4.steps.findIndex((step) => step.kind === 'pairs')
    expect(removalIndex).toBeGreaterThan(0)
    expect(removalIndex).toBeLessThan(pairsIndex)
  })

  it('keeps the raw table-filling results deterministic', () => {
    for (const challenge of CHALLENGES) {
      const input = {
        states: analyzeDFA(challenge.dfa).orderedReachable,
        alphabet: challenge.dfa.alphabet,
        transitions: challenge.dfa.transitions,
        finalStates: challenge.dfa.finalStates,
      }
      expect(runTableFilling(input)).toEqual(runTableFilling(input))
    }
  })
})
