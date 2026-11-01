import type { Pair, PairKey, PairRecord } from '../types/automata'
import type {
  MarkInfo,
  PairEvaluation,
  RefinementRound,
  SymbolComparison,
  TableFillingResult,
} from '../types/simulation'
import { makePair, pairKey } from '../utils/automataHelpers'

export interface TableFillingInput {
  /** Reachable states in the order used for the pair table. */
  states: string[]
  alphabet: string[]
  transitions: Record<string, Record<string, string>>
  finalStates: string[]
}

/**
 * The Table-Filling (pair-marking) algorithm.
 *
 * The initial pass marks every pair whose members disagree on accepting status
 * (the empty string already distinguishes them). Each refinement pass then
 * marks a pair when some symbol leads it to an already-marked pair.
 *
 * Decisions made in a pass are visible to later pairs in the same pass. This is
 * the standard in-place formulation of the algorithm: it still reaches the same
 * least fixed point, just possibly in fewer passes. `round` records the pass in
 * which a pair was marked, which is useful for teaching the dependency chain.
 */
export function runTableFilling(input: TableFillingInput): TableFillingResult {
  const { states, alphabet, transitions, finalStates } = input
  const order = new Map(states.map((state, index) => [state, index]))
  const finalSet = new Set(finalStates)
  const pairIndex: Record<PairKey, PairRecord> = {}
  const pairs: PairRecord[] = []

  for (let i = 0; i < states.length; i += 1) {
    for (let j = i + 1; j < states.length; j += 1) {
      const pair = makePair(states[i], states[j], order)
      const record: PairRecord = { ...pair, key: pairKey(pair) }
      pairs.push(record)
      pairIndex[record.key] = record
    }
  }

  const marked: Record<PairKey, MarkInfo> = {}
  const initialMarked: PairKey[] = []

  for (const pair of pairs) {
    const firstFinal = finalSet.has(pair.a)
    const secondFinal = finalSet.has(pair.b)
    if (firstFinal !== secondFinal) {
      marked[pair.key] = { reason: 'finality', round: 0 }
      initialMarked.push(pair.key)
    }
  }

  const rounds: RefinementRound[] = []
  let markingRounds = 0

  if (pairs.length > 0) {
    // Recompute destinations only for the states in the working set.
    const destination = (state: string, symbol: string): string => {
      const target = transitions[state]?.[symbol]
      if (target === undefined) {
        throw new Error(`Table filling needs a complete DFA: δ(${state}, ${symbol}) is missing.`)
      }
      return target
    }

    for (;;) {
      const round = rounds.length + 1
      const evaluations: PairEvaluation[] = []
      const newlyMarked: PairKey[] = []

      for (const pair of pairs) {
        if (marked[pair.key]) continue

        const comparisons: SymbolComparison[] = alphabet.map((symbol) => {
          const dest1 = destination(pair.a, symbol)
          const dest2 = destination(pair.b, symbol)
          const sameDestination = dest1 === dest2
          const destPair = sameDestination ? null : makePair(dest1, dest2, order)
          const destPairKey = destPair ? pairKey(destPair) : null
          return {
            symbol,
            from1: pair.a,
            from2: pair.b,
            dest1,
            dest2,
            destPair,
            destPairKey,
            sameDestination,
            distinguishable: destPairKey !== null && Boolean(marked[destPairKey]),
          }
        })

        const decisive = comparisons.find((comparison) => comparison.distinguishable)
        const isMarked = Boolean(decisive)

        evaluations.push({
          pair,
          comparisons,
          marked: isMarked,
          decisive,
        })

        if (decisive) {
          marked[pair.key] = {
            reason: 'transition',
            round,
            via: decisive,
            comparisons,
          }
          newlyMarked.push(pair.key)
        }
      }

      rounds.push({ round, evaluations, newlyMarked })
      if (newlyMarked.length > 0) {
        markingRounds = round
      } else {
        break
      }
    }
  }

  const equivalentPairs = pairs.filter((pair) => !marked[pair.key])
  const groups = buildGroups(states, equivalentPairs, order)

  return {
    order: states,
    pairs,
    pairIndex,
    marked,
    initialMarked,
    rounds,
    markingRounds,
    equivalentPairs,
    groups,
  }
}

/** Union-find over unmarked (equivalent) pairs. */
export function buildGroups(
  states: string[],
  equivalentPairs: Pair[],
  order: Map<string, number>,
): string[][] {
  const parent: Record<string, string> = {}
  for (const state of states) parent[state] = state

  const find = (state: string): string => {
    let current = state
    while (parent[current] !== current) current = parent[current]
    // Path compression.
    let walk = state
    while (parent[walk] !== walk) {
      const next = parent[walk]
      parent[walk] = current
      walk = next
    }
    return current
  }

  const union = (a: string, b: string) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent[rootB] = rootA
  }

  for (const pair of equivalentPairs) union(pair.a, pair.b)

  const buckets = new Map<string, string[]>()
  for (const state of states) {
    const root = find(state)
    const bucket = buckets.get(root)
    if (bucket) bucket.push(state)
    else buckets.set(root, [state])
  }

  return [...buckets.values()]
    .map((members) => [...members].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)))
    .sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
}
