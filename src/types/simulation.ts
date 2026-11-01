import type { EquivalenceGroup, MinimizedDFA, Pair, PairKey, PairRecord, TransitionRef } from './automata'

export type Phase =
  | 'validate'
  | 'reachability'
  | 'pairs'
  | 'initial'
  | 'refinement'
  | 'equivalence'
  | 'build'
  | 'done'

export type StepKind =
  | 'validation'
  | 'reachability-start'
  | 'reachability-visit'
  | 'reachability-complete'
  | 'remove-unreachable'
  | 'pairs'
  | 'initial-mark'
  | 'initial-complete'
  | 'round-start'
  | 'evaluate'
  | 'round-end'
  | 'equivalents'
  | 'build-states'
  | 'build-transitions'
  | 'done'

/** The result of following one symbol from both states of a pair. */
export interface SymbolComparison {
  symbol: string
  from1: string
  from2: string
  dest1: string
  dest2: string
  destPair: Pair | null
  destPairKey: PairKey | null
  /** True when the destination pair was already marked distinguishable. */
  distinguishable: boolean
  /** True when both states move to the very same state on this symbol. */
  sameDestination: boolean
}

export interface MarkInfo {
  reason: 'finality' | 'transition'
  /** 0 means the initial final/non-final marking. */
  round: number
  via?: SymbolComparison
  /** Comparisons captured at the moment the pair was evaluated. */
  comparisons?: SymbolComparison[]
}

export interface PairEvaluation {
  pair: PairRecord
  comparisons: SymbolComparison[]
  marked: boolean
  decisive?: SymbolComparison
}

export interface RefinementRound {
  round: number
  evaluations: PairEvaluation[]
  newlyMarked: PairKey[]
}

export interface TableFillingResult {
  /** Reachable states in their original declaration order. */
  order: string[]
  pairs: PairRecord[]
  pairIndex: Record<PairKey, PairRecord>
  marked: Record<PairKey, MarkInfo>
  initialMarked: PairKey[]
  rounds: RefinementRound[]
  /** Number of refinement passes that actually marked at least one pair. */
  markingRounds: number
  equivalentPairs: PairRecord[]
  groups: string[][]
}

export interface AlgorithmStep {
  index: number
  kind: StepKind
  phase: Phase
  title: string
  what: string
  why: string
  operation: string
  result: string
  example?: string
  technical?: string
  bullets?: string[]

  /** Cumulative list of distinguishable pairs after this step. */
  markedSoFar: PairKey[]
  /** Pairs newly marked by this very step (used for pulse animations). */
  newlyMarked: PairKey[]

  /** States to emphasise in the original graph. */
  focusStates: string[]
  /** Transitions to emphasise in the original graph. */
  activeTransitions: TransitionRef[]
  /** Reachability progress. */
  showReachability: boolean
  visited: string[]
  reachable: string[]
  unreachable: string[]
  fadeUnreachable: boolean

  pair?: PairRecord
  comparisons?: SymbolComparison[]
  round?: number

  showPairs: boolean
  showGroups: boolean
  groups?: EquivalenceGroup[]
  showMinimized: boolean
}

export interface BuildResult {
  minimized: MinimizedDFA
  groups: EquivalenceGroup[]
  consistent: boolean
  inconsistencies: string[]
}

export interface Analysis {
  valid: boolean
  validation: import('./automata').ValidationResult
  steps: AlgorithmStep[]
  reachable: string[]
  unreachable: string[]
  orderedReachable: string[]
  pairs: PairRecord[]
  pairIndex: Record<PairKey, PairRecord>
  marked: Record<PairKey, MarkInfo>
  rounds: RefinementRound[]
  markingRounds: number
  equivalentPairs: PairRecord[]
  groups: string[][]
  minimized: MinimizedDFA | null
  build: BuildResult | null
  table: TableFillingResult | null
  /** Index of the first step in which the pair matrix becomes meaningful. */
  pairsStepIndex: number
  /** Index of the last step (equal to steps.length - 1). */
  lastStepIndex: number
}
