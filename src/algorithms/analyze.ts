import type { DFA, EquivalenceGroup, PairKey, PairRecord } from '../types/automata'
import type {
  AlgorithmStep,
  Analysis,
  Phase,
  StepKind,
  SymbolComparison,
} from '../types/simulation'
import {
  classLabel,
  formatPair,
  formatSet,
  makePair,
  pairKey,
  transitionRefsForPair,
  uniqueRefs,
} from '../utils/automataHelpers'
import { buildMinimizedDFA } from './buildMinimizedDFA'
import { findReachable } from './reachability'
import { runTableFilling } from './tableFilling'
import { validateDFA } from './validation'

const TECHNICAL = {
  validation:
    'A DFA is a 5-tuple M = (Q, Σ, δ, q₀, F). We check that Q and Σ are non-empty, q₀ ∈ Q, F ⊆ Q, and δ: Q × Σ → Q is totally defined.',
  reachability:
    'A state q is reachable when there is a string w ∈ Σ* with δ*(q₀, w) = q. Removing non-reachable states preserves L(M), because the initial run can never enter them.',
  pairs:
    'For |Q| = n we consider the n(n−1)/2 unordered pairs {p, q} with p ≠ q. Distinguishability is symmetric, so (p, q) and (q, p) are the same table cell.',
  initial:
    'States p and q are distinguishable if some string w ∈ Σ* is accepted from one but not the other. If p ∈ F and q ∉ F, the empty string ε is already a witness.',
  evaluate:
    'Marking rule: if δ(p, a) and δ(q, a) are distinguishable for some a ∈ Σ, then p and q are distinguishable. Repeating this rule to a fixed point computes exactly the Myhill–Nerode relation.',
  equivalents:
    'The unmarked pairs are the equivalence classes of the Myhill–Nerode relation: p ≡ q iff (∀w ∈ Σ*) [δ*(p, w) ∈ F ⇔ δ*(q, w) ∈ F].',
  build:
    'The minimized DFA is the quotient M/≡. Its states are the classes [q], δ′([q], a) = [δ(q, a)], the start class is [q₀], and [q] is accepting iff q ∈ F.',
  done:
    'The quotient construction yields the unique (up to isomorphism) minimal complete DFA for L(M). Its state count equals the number of Myhill–Nerode classes of the reachable states.',
} as const

function phaseFor(kind: StepKind): Phase {
  switch (kind) {
    case 'validation':
      return 'validate'
    case 'reachability-start':
    case 'reachability-visit':
    case 'reachability-complete':
    case 'remove-unreachable':
      return 'reachability'
    case 'pairs':
      return 'pairs'
    case 'initial-mark':
    case 'initial-complete':
      return 'initial'
    case 'round-start':
    case 'evaluate':
    case 'round-end':
      return 'refinement'
    case 'equivalents':
      return 'equivalence'
    case 'build-states':
    case 'build-transitions':
      return 'build'
    case 'done':
      return 'done'
  }
}

function comparisonSentence(comparison: SymbolComparison): string {
  if (comparison.sameDestination) {
    return `On input ${comparison.symbol}: both ${comparison.from1} and ${comparison.from2} go to ${comparison.dest1}. This symbol cannot separate the pair.`
  }
  const destination = comparison.destPair ? formatPair(comparison.destPair) : 'a pair'
  if (comparison.distinguishable) {
    return `On input ${comparison.symbol}: ${comparison.from1} → ${comparison.dest1} and ${comparison.from2} → ${comparison.dest2}. The destination pair ${destination} is already marked, so it separates this pair.`
  }
  return `On input ${comparison.symbol}: ${comparison.from1} → ${comparison.dest1} and ${comparison.from2} → ${comparison.dest2}. The destination pair ${destination} is not marked, so this symbol does not separate the pair yet.`
}

function groupBullets(groups: EquivalenceGroup[]): string[] {
  return groups.map((group) => {
    const tags = [group.isInitial ? 'initial' : null, group.isFinal ? 'accepting' : null].filter(
      Boolean,
    )
    return `${group.name} = {${group.members.join(', ')}}${tags.length ? ` — ${tags.join(', ')}` : ''}`
  })
}

function capList(items: string[], limit = 12): string[] {
  if (items.length <= limit) return items
  return [...items.slice(0, limit), `…and ${items.length - limit} more`]
}

/**
 * Runs validation, reachability, table filling and quotient construction, and
 * records every intermediate operation as an AlgorithmStep. The UI is a pure
 * function of this array: it never recomputes mathematics while stepping.
 */
export function analyzeDFA(dfa: DFA): Analysis {
  const validation = validateDFA(dfa)
  const steps: AlgorithmStep[] = []
  const reachability = validation.valid ? findReachable(dfa) : null
  const reachable = reachability?.reachable ?? []
  const unreachable = reachability?.unreachable ?? []
  const orderedReachable = reachability?.orderedReachable ?? []

  let showPairs = false
  let showGroups = false
  let showMinimized = false
  let fadeUnreachable = false
  let roundInProgress: number | undefined
  const markedList: PairKey[] = []
  const markedSet = new Set<PairKey>()

  const addMark = (key: PairKey) => {
    if (!markedSet.has(key)) {
      markedSet.add(key)
      markedList.push(key)
    }
  }

  type StepInput = Partial<AlgorithmStep> &
    Pick<AlgorithmStep, 'kind' | 'title' | 'what' | 'why' | 'operation' | 'result'>

  const push = (input: StepInput) => {
    const step: AlgorithmStep = {
      index: steps.length,
      phase: phaseFor(input.kind),
      markedSoFar: [...markedList],
      newlyMarked: [],
      focusStates: [],
      activeTransitions: [],
      showReachability: false,
      visited: [],
      reachable,
      unreachable,
      fadeUnreachable,
      showPairs,
      showGroups,
      showMinimized,
      round: roundInProgress,
      ...input,
    }
    steps.push(step)
    return step
  }

  if (!validation.valid) {
    push({
      kind: 'validation',
      title: 'DFA validation failed',
      what: 'Before minimization can begin, the input must be a complete deterministic finite automaton.',
      why: 'The table-filling method looks up δ(p, a) and δ(q, a) for every pair and every symbol. If a transition is missing or points to a non-existent state, those comparisons cannot be made.',
      operation: `Checked ${dfa.states.length} state(s), ${dfa.alphabet.length} symbol(s), the initial state and ${dfa.finalStates.length} accepting state(s).`,
      result: `Found ${validation.errors.length} problem(s). Fix them in the input panel, then run the walkthrough again.`,
      bullets: capList(validation.errors, 20),
      technical: TECHNICAL.validation,
    })

    return {
      valid: false,
      validation,
      steps,
      reachable: [],
      unreachable: [],
      orderedReachable: [],
      pairs: [],
      pairIndex: {},
      marked: {},
      rounds: [],
      markingRounds: 0,
      equivalentPairs: [],
      groups: [],
      minimized: null,
      build: null,
      table: null,
      pairsStepIndex: 0,
      lastStepIndex: steps.length - 1,
    }
  }

  const reach = reachability as NonNullable<typeof reachability>

  // ---------------------------------------------------------------------
  // Step 1 — validation accepted
  // ---------------------------------------------------------------------
  push({
    kind: 'validation',
    title: 'DFA validated',
    what: 'The input is a well-formed, complete DFA. Every state has exactly one destination for each alphabet symbol.',
    why: 'Minimization only makes sense for a complete DFA: the algorithm must be able to compare the destination of every pair on every input.',
    operation: `Checked the state set, alphabet, initial state, accepting states and all ${dfa.states.length * dfa.alphabet.length} transitions.`,
    result: 'All validation checks passed. Reachability analysis comes next.',
    bullets: [
      `States (${dfa.states.length}): ${formatSet(dfa.states)}`,
      `Alphabet (${dfa.alphabet.length}): ${formatSet(dfa.alphabet)}`,
      `Initial state: ${dfa.initialState}`,
      `Accepting states: ${formatSet(dfa.finalStates)}`,
      'Transition function: complete — no undefined destinations',
      ...validation.warnings,
    ],
    technical: TECHNICAL.validation,
  })

  // ---------------------------------------------------------------------
  // Step 2 — reachability
  // ---------------------------------------------------------------------
  push({
    kind: 'reachability-start',
    title: `Start reachability from ${dfa.initialState}`,
    what: 'The algorithm first discovers which states can actually be entered from the initial state.',
    why: 'A state that cannot be reached can never affect whether a string is accepted. Such states are not part of the language and must not be merged with reachable states.',
    operation: `Start a breadth-first search (BFS) at the initial state ${dfa.initialState}.`,
    result: `Visited: ${formatSet([dfa.initialState])}. There are ${dfa.states.length} state(s) to account for.`,
    focusStates: [dfa.initialState],
    showReachability: true,
    visited: [dfa.initialState],
    technical: TECHNICAL.reachability,
  })

  const visitedProgress: string[] = [dfa.initialState]
  for (const discovery of reach.discovery) {
    if (!discovery.via) continue
    visitedProgress.push(discovery.state)
    push({
      kind: 'reachability-visit',
      title: `Discover state ${discovery.state}`,
      what: `${discovery.state} is reachable from the initial state ${dfa.initialState}.`,
      why: 'Every reachable state can occur during some run of the DFA, so it must be included in the minimization table.',
      operation: `Enter ${discovery.state} from ${discovery.via.from} on input ${discovery.via.symbol}, then queue all of its outgoing transitions.`,
      result: `Reachable so far: ${formatSet(visitedProgress)}.`,
      focusStates: [discovery.state],
      activeTransitions: [discovery.via],
      showReachability: true,
      visited: [...visitedProgress],
      technical: TECHNICAL.reachability,
    })
  }

  push({
    kind: 'reachability-complete',
    title: 'Reachability analysis complete',
    what: `BFS visited ${reach.reachable.length} of ${dfa.states.length} states.`,
    why: unreachable.length
      ? 'The states that were never visited cannot be entered from the initial state. They will be removed before pairs are generated.'
      : 'Every state is reachable, so the whole state set participates in minimization.',
    operation: 'Compare the visited set with the declared state set.',
    result: unreachable.length
      ? `${reach.reachable.length} state(s) are reachable; ${unreachable.length} are unreachable and will be removed.`
      : 'All states are reachable. Nothing needs to be removed.',
    bullets: [
      `Reachable (${reach.reachable.length}): ${formatSet(reach.reachable)}`,
      `Unreachable (${unreachable.length}): ${formatSet(unreachable)}`,
    ],
    showReachability: true,
    visited: [...reach.reachable],
    technical: TECHNICAL.reachability,
  })

  if (unreachable.length > 0) {
    fadeUnreachable = true
    push({
      kind: 'remove-unreachable',
      title: `Remove ${unreachable.length} unreachable state${unreachable.length === 1 ? '' : 's'} from the table`,
      what: `${formatSet(unreachable)} cannot be reached from ${dfa.initialState} by any input string.`,
      why: 'Unreachable states are irrelevant to the accepted language. Including them in the pair table could make them look equivalent to reachable states, which would create meaningless groups.',
      operation: 'Delete each unreachable state and every transition entering or leaving it. Continue with the reachable states only.',
      result: `The working state set is now ${formatSet(orderedReachable)} (${orderedReachable.length} state${orderedReachable.length === 1 ? '' : 's'}).`,
      bullets: [
        `Removed: ${formatSet(unreachable)}`,
        'Transitions that touched a removed state are discarded with it.',
      ],
      technical:
        'For every string w, the run of M from q₀ never visits an unreachable state. Therefore deleting those states gives a DFA with exactly the same language.',
    })
  }

  // ---------------------------------------------------------------------
  // Steps 3–6 — pair table, initial marking, refinement
  // ---------------------------------------------------------------------
  const table = runTableFilling({
    states: orderedReachable,
    alphabet: dfa.alphabet,
    transitions: dfa.transitions,
    finalStates: dfa.finalStates,
  })
  const build = buildMinimizedDFA(dfa, table.groups)

  if (table.pairs.length === 0) {
    push({
      kind: 'pairs',
      title: 'No state pairs to compare',
      what: 'Only one reachable state remains, so there are no unordered pairs of distinct states.',
      why: 'The pair table is only needed when at least two states could possibly be merged.',
      operation: 'Evaluate n(n−1)/2 with n = 1: the result is 0.',
      result: 'The DFA already has a single reachable state. It cannot be reduced any further.',
      showPairs: true,
      technical: TECHNICAL.pairs,
    })
    showGroups = true
    push({
      kind: 'equivalents',
      title: 'One equivalence class',
      what: 'The single reachable state is trivially equivalent to itself.',
      why: 'There is no second state to compare it with, so no merging is possible.',
      operation: 'Build the equivalence class from the empty set of unmarked pairs.',
      result: `The only class is ${classLabel(orderedReachable)}.`,
      showGroups: true,
      groups: build.groups,
      technical: TECHNICAL.equivalents,
    })
    showMinimized = false
    push({
      kind: 'build-states',
      title: 'Create the minimized state',
      what: 'The one equivalence class becomes the only state of the minimized DFA.',
      why: 'The quotient automaton has exactly one state per equivalence class.',
      operation: 'Copy the class name into the new state set.',
      result: `Minimized state set: ${formatSet(build.minimized.states)}.`,
      groups: build.groups,
      technical: TECHNICAL.build,
    })
    showMinimized = true
    push({
      kind: 'build-transitions',
      title: 'Copy the transitions',
      what: 'Transitions are inherited from the only member of the class.',
      why: 'Since no states are merged, the transition structure is unchanged apart from any unreachable states that were removed.',
      operation: 'For each symbol, follow the transition of the class representative.',
      result: build.consistent
        ? 'All transitions are consistent within every class.'
        : build.inconsistencies.join(' '),
      bullets: build.groups.flatMap((group) =>
        dfa.alphabet.map(
          (symbol) =>
            `δ(${group.name}, ${symbol}) = ${build.minimized.transitions[group.name]?.[symbol] ?? '—'}`,
        ),
      ),
      groups: build.groups,
      showMinimized: true,
      technical: TECHNICAL.build,
    })
    push({
      kind: 'done',
      title: 'Minimized DFA complete',
      what: 'The construction is finished and the minimized graph is ready.',
      why: 'Unreachable states were removed and the remaining single state is already minimal.',
      operation: 'Collect the original and minimized statistics.',
      result: `Original ${dfa.states.length} state(s) → minimal ${build.minimized.states.length} state(s).`,
      bullets: doneBullets(dfa, orderedReachable, unreachable, table.pairs.length, build.groups),
      groups: build.groups,
      showMinimized: true,
      technical: TECHNICAL.done,
    })

    return finalize(validation, steps, reach, orderedReachable, table, build)
  }

  showPairs = true
  const firstPairs = table.pairs.slice(0, 3).map(formatPair).join(', ')
  push({
    kind: 'pairs',
    title: `Generate all ${table.pairs.length} state pairs`,
    what: `Every unordered pair of reachable states is placed in the triangular table: (${table.order.join(', ')}).`,
    why: 'Minimization asks one question about each pair: can any input string tell these two states apart? The table keeps every answer in one place.',
    operation: `Use n(n−1)/2 with n = ${table.order.length}: ${table.order.length} × ${table.order.length - 1} ÷ 2 = ${table.pairs.length} unique pairs.`,
    result: `${table.pairs.length} pair(s) were generated. Unreachable states are not included.`,
    example: `For states ${formatSet(table.order)}, the pairs include ${firstPairs}.`,
    technical: TECHNICAL.pairs,
  })

  // Initial marking.
  const initialMarked = table.initialMarked
  for (const key of initialMarked) {
    const pair = table.pairIndex[key]
    const finalA = dfa.finalStates.includes(pair.a)
    const finalB = dfa.finalStates.includes(pair.b)
    addMark(key)
    push({
      kind: 'initial-mark',
      title: `Mark ${formatPair(pair)} as distinguishable`,
      what: `One state is accepting and the other is not.`,
      why: 'Accepting status alone already separates the states. A string accepted from the accepting state is rejected from the non-accepting one.',
      operation: `Compare the accepting status: ${pair.a} is ${finalA ? 'accepting' : 'non-accepting'}; ${pair.b} is ${finalB ? 'accepting' : 'non-accepting'}.`,
      result: `${formatPair(pair)} is marked distinguishable.`,
      example: `The empty string ε is a witness: starting at ${finalA ? pair.a : pair.b} it is accepted; starting at ${finalA ? pair.b : pair.a} it is rejected.`,
      pair,
      focusStates: [pair.a, pair.b],
      newlyMarked: [key],
      technical: TECHNICAL.initial,
    })
  }

  push({
    kind: 'initial-complete',
    title: initialMarked.length
      ? 'Initial marking complete'
      : 'No final/non-final conflicts',
    what: initialMarked.length
      ? `${initialMarked.length} pair(s) were marked using accepting status.`
      : 'Every pair has the same accepting status, so the empty string does not distinguish any of them.',
      why: 'This is the base of the fixed point. Transition-based marking will build on these marks in later rounds.',
    operation: 'Count the pairs that remain unmarked after the initial pass.',
    result: `${initialMarked.length} of ${table.pairs.length} pair(s) are marked; ${table.pairs.length - initialMarked.length} remain to be tested.`,
    bullets: initialMarked.length
      ? [`Marked now: ${capList(initialMarked.map((key) => formatPair(table.pairIndex[key])), 14).join(', ')}`]
      : ['No pair is distinguished by final status alone.'],
    technical: TECHNICAL.initial,
  })

  // Refinement passes.
  for (const round of table.rounds) {
    roundInProgress = round.round
    push({
      kind: 'round-start',
      title: `Refinement round ${round.round}`,
      what: 'Each remaining unmarked pair is now tested against every symbol in the alphabet.',
      why: 'A pair becomes distinguishable when some symbol sends its two states into a pair that is already known to be distinguishable.',
      operation: `Check ${round.evaluations.length} unmarked pair(s) on ${dfa.alphabet.length} symbol(s): ${dfa.alphabet.join(', ')}.`,
      result: 'The comparisons for this round follow one pair at a time.',
      round: round.round,
      technical: TECHNICAL.evaluate,
    })

    for (const evaluation of round.evaluations) {
      const pair = evaluation.pair
      const activeTransitions = evaluation.decisive
        ? uniqueRefs([
            {
              from: pair.a,
              symbol: evaluation.decisive.symbol,
              to: evaluation.decisive.dest1,
            },
            {
              from: pair.b,
              symbol: evaluation.decisive.symbol,
              to: evaluation.decisive.dest2,
            },
          ])
        : uniqueRefs(transitionRefsForPair(dfa, pair))

      if (evaluation.marked) addMark(pair.key)

      push({
        kind: 'evaluate',
        title: evaluation.marked
          ? `Mark ${formatPair(pair)} — distinguishable`
          : `${formatPair(pair)} — no distinction found`,
        what: `The pair ${formatPair(pair)} is checked on every input symbol.`,
        why: 'If a symbol leads the pair into an already distinguishable pair, then that symbol is the first character of a string that separates the two states.',
        operation: `For each symbol a ∈ ${formatSet(dfa.alphabet)}, compare δ(${pair.a}, a) with δ(${pair.b}, a).`,
        result: evaluation.marked
          ? `${formatPair(pair)} is distinguishable because of input ${evaluation.decisive?.symbol ?? ''}.`
          : 'No already-marked destination pair was found. The pair stays unmarked for this round.',
        example: evaluation.marked
          ? `The destination pair ${formatPair(evaluation.decisive?.destPair ?? pair)} is already marked, so the input prefix ${evaluation.decisive?.symbol ?? ''} carries that distinction back to ${formatPair(pair)}.`
          : undefined,
        bullets: evaluation.comparisons.map(comparisonSentence),
        pair,
        comparisons: evaluation.comparisons,
        focusStates: [pair.a, pair.b],
        activeTransitions,
        newlyMarked: evaluation.marked ? [pair.key] : [],
        round: round.round,
        technical: TECHNICAL.evaluate,
      })
    }

    if (round.newlyMarked.length > 0) {
      push({
        kind: 'round-end',
        title: `Round ${round.round} complete — ${round.newlyMarked.length} newly marked`,
        what: `${round.newlyMarked.length} pair(s) became distinguishable during this pass.`,
        why: 'New marks can unlock more marks in the next round, so the algorithm must keep going until a full pass changes nothing.',
        operation: 'Add this round’s marks to the table and prepare another pass over the remaining unmarked pairs.',
        result: `${markedList.length} of ${table.pairs.length} pair(s) are now marked.`,
        bullets: [
          `Newly marked: ${round.newlyMarked.map((key) => formatPair(table.pairIndex[key])).join(', ')}`,
        ],
        round: round.round,
        technical: TECHNICAL.evaluate,
      })
    } else {
      push({
        kind: 'round-end',
        title: 'No new pairs marked — fixed point reached',
        what: 'A complete pass over the remaining unmarked pairs produced no new marks.',
        why: 'Nothing else can be distinguished using the current table. The remaining unmarked pairs are exactly the equivalent pairs.',
        operation: 'Stop the fixed-point loop.',
        result: `${table.equivalentPairs.length} pair(s) remain unmarked and are therefore equivalent.`,
        round: round.round,
        technical: TECHNICAL.evaluate,
      })
    }
  }

  // Equivalence classes.
  roundInProgress = undefined
  showGroups = true
  const multiGroups = build.groups.filter((group) => group.members.length > 1)
  push({
    kind: 'equivalents',
    title: 'Identify equivalent states',
    what: `After the fixed point, ${table.equivalentPairs.length} pair(s) are still unmarked. These are the equivalent pairs.`,
    why: 'Equivalent states accept exactly the same set of future input strings. Keeping more than one copy of such a state adds no expressive power.',
    operation: 'Merge every state that is connected to another state by an unmarked pair, producing equivalence classes.',
    result: `${table.equivalentPairs.length} equivalent pair(s) collapse into ${build.groups.length} equivalence class(es).`,
    bullets: groupBullets(build.groups),
    focusStates: multiGroups.flatMap((group) => group.members),
    showGroups: true,
    groups: build.groups,
    technical: TECHNICAL.equivalents,
  })

  // Minimized DFA.
  showMinimized = false
  push({
    kind: 'build-states',
    title: `Create ${build.groups.length} minimized state${build.groups.length === 1 ? '' : 's'}`,
    what: 'Each equivalence class becomes exactly one state of the minimized DFA. The class name lists its members.',
    why: 'States inside a class are indistinguishable, so a single representative state is enough for every future input.',
    operation: 'Copy every class into the new state set. Mark the class containing the original initial state as initial, and any class containing an accepting state as accepting.',
    result: `New state set: ${formatSet(build.minimized.states)}. Initial state: ${build.minimized.initialState}. Accepting: ${formatSet(build.minimized.finalStates)}.`,
    bullets: groupBullets(build.groups),
    showGroups: true,
    groups: build.groups,
    technical: TECHNICAL.build,
  })

  showMinimized = true
  push({
    kind: 'build-transitions',
    title: 'Wire the minimized transitions',
    what: 'Every class inherits the transitions of its members. Because the members are equivalent, every member must agree on the destination class.',
    why: 'The quotient DFA must accept exactly the same strings as the original. Consistency inside each class is what makes this possible.',
    operation: 'For each class and each symbol, follow any member of the class and record the class of the destination.',
    result: build.consistent
      ? 'All transitions are consistent within every equivalence class. The minimized DFA is ready.'
      : `Consistency check failed: ${build.inconsistencies.join(' ')}`,
    bullets: build.groups.flatMap((group) =>
      dfa.alphabet.map(
        (symbol) =>
          `δ(${group.name}, ${symbol}) = ${build.minimized.transitions[group.name]?.[symbol] ?? '—'}`,
      ),
    ),
    groups: build.groups,
    showMinimized: true,
    technical: TECHNICAL.build,
  })

  push({
    kind: 'done',
    title: 'Minimized DFA complete',
    what: `The reachable ${orderedReachable.length}-state automaton has been reduced to ${build.minimized.states.length} state(s).`,
    why: 'The quotient automaton has no equivalent states left, so it is the smallest complete DFA for the same language.',
    operation: 'Collect the original and minimized statistics for the final summary.',
    result:
      build.minimized.states.length < orderedReachable.length
        ? `Reduced from ${orderedReachable.length} reachable state(s) to ${build.minimized.states.length} state(s).`
        : `No reachable states could be merged: the reachable DFA was already minimal.`,
    bullets: doneBullets(dfa, orderedReachable, unreachable, table.pairs.length, build.groups),
    groups: build.groups,
    showMinimized: true,
    technical: TECHNICAL.done,
  })

  return finalize(validation, steps, reach, orderedReachable, table, build)
}

function doneBullets(
  dfa: DFA,
  orderedReachable: string[],
  unreachable: string[],
  pairCount: number,
  groups: EquivalenceGroup[],
): string[] {
  return [
    `Original states: ${dfa.states.length}`,
    `Reachable: ${orderedReachable.length}${unreachable.length ? ` (removed ${unreachable.length} unreachable)` : ''}`,
    `Pairs examined: ${pairCount}`,
    `Equivalence classes: ${groups.length}`,
    `Minimized accepting states: ${groups.filter((group) => group.isFinal).length}`,
  ]
}

function finalize(
  validation: Analysis['validation'],
  steps: AlgorithmStep[],
  reach: ReturnType<typeof findReachable>,
  orderedReachable: string[],
  table: ReturnType<typeof runTableFilling>,
  build: ReturnType<typeof buildMinimizedDFA>,
): Analysis {
  const pairsStepIndex = steps.findIndex((step) => step.kind === 'pairs')
  return {
    valid: true,
    validation,
    steps,
    reachable: reach.reachable,
    unreachable: reach.unreachable,
    orderedReachable,
    pairs: table.pairs,
    pairIndex: table.pairIndex,
    marked: table.marked,
    rounds: table.rounds,
    markingRounds: table.markingRounds,
    equivalentPairs: table.equivalentPairs,
    groups: table.groups,
    minimized: build.minimized,
    build,
    table,
    pairsStepIndex: pairsStepIndex === -1 ? 0 : pairsStepIndex,
    lastStepIndex: steps.length - 1,
  }
}

/** Utility used by the UI to look up the canonical pair record for two states. */
export function getPairRecord(
  analysis: Analysis,
  stateA: string,
  stateB: string,
): PairRecord | null {
  const order = new Map(analysis.orderedReachable.map((state, index) => [state, index]))
  if (!order.has(stateA) || !order.has(stateB) || stateA === stateB) return null
  const pair = makePair(stateA, stateB, order)
  return analysis.pairIndex[pairKey(pair)] ?? null
}

export type { PairRecord }
