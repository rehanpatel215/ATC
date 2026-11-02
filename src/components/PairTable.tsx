import { CircleCheck, CircleX, Info, X } from 'lucide-react'
import type { DFA, PairKey, PairRecord } from '../types/automata'
import type { Analysis } from '../types/simulation'
import { shortestDistinguishingString } from '../algorithms/verification'
import { formatPair, pairKey } from '../utils/automataHelpers'
import { cn } from '../utils/cn'

interface PairTableProps {
  analysis: Analysis
  dfa: DFA
  /** False until the walkthrough reaches the pair-generation step. */
  visible: boolean
  /** Pairs marked as distinguishable at the current step. */
  markedSoFar: PairKey[]
  /** True once the fixed point was reached (unmarked = equivalent). */
  finalized: boolean
  newlyMarked?: PairKey[]
  currentPair?: PairRecord
  selectedKey: PairKey | null
  onSelect: (pair: PairRecord | null) => void
}

function cellTone(marked: boolean, finalized: boolean): string {
  if (marked) {
    return 'border-[#c9a79b] bg-[#f7ece7] text-[#7c4232] dark:border-[#7c4232]/55 dark:bg-[#7c4232]/15 dark:text-[#e0b8a9]'
  }
  if (finalized) {
    return 'border-[#A8B5A0] bg-[#e7ede3] text-[#3e4c3f] dark:border-[#A8B5A0]/45 dark:bg-[#A8B5A0]/12 dark:text-[#C7D3C1]'
  }
  return 'border-[#C7D3C1] bg-[#FAFAF7] text-[#3a463b]/75 dark:border-[#3a443a] dark:bg-[#1b211c]/70 dark:text-[#C7D3C1]/70'
}

function CellContent({
  marked,
  finalized,
  markLabel,
  pulsing,
}: {
  marked: boolean
  finalized: boolean
  markLabel: string
  pulsing: boolean
}) {
  if (marked) {
    return (
      <span className={cn('flex flex-col items-center leading-none', pulsing && 'animate-mark')}>
        <CircleX className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
        <span className="mt-0.5 text-[8px] font-bold uppercase tracking-wide">{markLabel}</span>
      </span>
    )
  }
  if (finalized) {
    return <CircleCheck className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
  }
  return <span className="text-sm leading-none">·</span>
}

/**
 * Triangular pair matrix. The cell in row i, column j (j < i) holds the
 * unordered pair {states[j], states[i]}. Marks are cumulative: a cell only
 * shows a cross once the walkthrough has actually reached that mark, which
 * makes the fixed-point progression visible.
 */
export function PairTable({
  analysis,
  dfa,
  visible,
  markedSoFar,
  finalized,
  newlyMarked,
  currentPair,
  selectedKey,
  onSelect,
}: PairTableProps) {
  const order = analysis.orderedReachable
  const markedSet = new Set(markedSoFar)
  const newSet = new Set(newlyMarked ?? [])
  const currentKey = currentPair?.key
  const pairCount = analysis.pairs.length

  const selected = selectedKey
    ? (analysis.pairs.find((pair) => pair.key === selectedKey) ?? null)
    : null

  if (!visible) {
    return (
      <div className="app-card card-pad">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2F5EF] text-[#3a463b]/75 dark:bg-[#263026] dark:text-[#C7D3C1]/70">
            <Info className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="card-title">Table-filling matrix</h2>
            <p className="mt-1 text-xs leading-relaxed text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
              The triangular table appears after the reachability analysis. Every unordered pair of
              reachable states will get exactly one cell.
            </p>
            {analysis.valid && analysis.unreachable.length > 0 && (
              <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 text-[11px] text-[#765c2e] dark:text-[#dcc295]">
                <span className="chip chip-amber">unreachable</span>
                {analysis.unreachable.join(', ')} will be removed first and never added to the table.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (order.length < 2) {
    return (
      <div className="app-card card-pad">
        <h2 className="card-title">Table-filling matrix</h2>
        <p className="mt-1 text-xs leading-relaxed text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
          Only one reachable state remains, so there are no pairs to compare. The minimized DFA keeps
          that single state.
        </p>
      </div>
    )
  }

  return (
    <div className="app-card card-pad">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="card-title">Table-filling matrix</h2>
          <p className="card-subtitle mt-0.5">
            {order.length} reachable states · n(n−1)/2 = {pairCount} unordered pairs
            {analysis.unreachable.length > 0 ? ` · ${analysis.unreachable.length} unreachable removed` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
          <span className="inline-flex items-center gap-1">
            <CircleX className="h-3 w-3 text-[#7c4232] dark:text-[#e0b8a9]" aria-hidden="true" />
            distinguishable
          </span>
          <span className="inline-flex items-center gap-1">
            <CircleCheck className="h-3 w-3 text-[#3e4c3f] dark:text-[#C7D3C1]" aria-hidden="true" />
            equivalent
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="text-sm leading-none">·</span> not yet decided
          </span>
        </div>
      </div>

      {analysis.unreachable.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-[#d8c39b] bg-[#f6efdf]/70 px-2.5 py-1.5 text-[11px] text-[#765c2e] dark:border-[#8a6d38]/45 dark:bg-[#8a6d38]/12 dark:text-[#dcc295]">
          <span className="font-semibold uppercase tracking-wide">Excluded:</span>
          {analysis.unreachable.map((state) => (
            <span
              key={state}
              className="rounded border border-[#d8c39b] bg-[#FAFAF7]/70 px-1.5 py-0.5 font-mono text-[10px] line-through dark:border-[#8a6d38]/45 dark:bg-[#1b211c]/40"
            >
              {state}
            </span>
          ))}
          <span>cannot be reached from the initial state.</span>
        </div>
      )}

      <div className="mt-3 overflow-x-auto pb-1">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="w-16" aria-label="State column" />
              {order.slice(0, -1).map((state) => {
                const highlighted =
                  currentPair?.a === state ||
                  currentPair?.b === state ||
                  selected?.a === state ||
                  selected?.b === state
                return (
                  <th
                    key={state}
                    scope="col"
                    className={cn(
                      'min-w-[42px] px-1 pb-1 text-center font-mono text-[11px] font-semibold transition-colors',
                      highlighted
                        ? 'text-[#465447] dark:text-[#A8B5A0]'
                        : 'text-[#3a463b]/75 dark:text-[#C7D3C1]/70',
                    )}
                  >
                    {state}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {order.map((rowState, rowIndex) => {
              if (rowIndex === 0) return null
              const rowHighlighted =
                currentPair?.a === rowState ||
                currentPair?.b === rowState ||
                selected?.a === rowState ||
                selected?.b === rowState
              return (
                <tr key={rowState}>
                  <th
                    scope="row"
                    className={cn(
                      'whitespace-nowrap pr-1.5 text-right font-mono text-[11px] font-semibold transition-colors',
                      rowHighlighted
                        ? 'text-[#465447] dark:text-[#A8B5A0]'
                        : 'text-[#3a463b]/75 dark:text-[#C7D3C1]/70',
                    )}
                  >
                    {rowState}
                  </th>
                  {order.map((columnState, columnIndex) => {
                    if (columnIndex >= rowIndex) {
                      return <td key={columnState} aria-hidden="true" />
                    }
                    const pair: PairRecord = {
                      a: columnState,
                      b: rowState,
                      key: pairKey({ a: columnState, b: rowState }),
                    }
                    const marked = markedSet.has(pair.key)
                    const markInfo = analysis.marked[pair.key]
                    const markLabel = markInfo
                      ? markInfo.reason === 'finality'
                        ? 'F'
                        : `R${markInfo.round}`
                      : '?'
                    const isCurrent = currentKey === pair.key
                    const isSelected = selectedKey === pair.key
                    const isNew = newSet.has(pair.key)
                    return (
                      <td key={columnState}>
                        <button
                          type="button"
                          onClick={() => onSelect(pair)}
                          title={`${formatPair(pair)} — ${
                            marked
                              ? markInfo?.reason === 'finality'
                                ? 'distinguishable (accepting status)'
                                : `distinguishable (round ${markInfo?.round ?? '?'})`
                              : finalized
                                ? 'equivalent'
                                : 'not yet decided'
                          }`}
                          aria-label={`Pair ${formatPair(pair)}, ${
                            marked ? 'distinguishable' : finalized ? 'equivalent' : 'not yet decided'
                          }`}
                          aria-pressed={isSelected}
                          className={cn(
                            'flex h-10 w-full min-w-[42px] items-center justify-center rounded-md border text-xs shadow-sm transition-colors duration-150 hover:border-[#A8B5A0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465447] dark:focus-visible:ring-[#A8B5A0]',
                            cellTone(marked, finalized),
                            isNew && 'animate-mark',
                            isCurrent && 'ring-2 ring-[#8a6d38] ring-offset-1 dark:ring-[#dcc295] dark:ring-offset-[#151a16]',
                            isSelected &&
                              'ring-2 ring-[#465447] ring-offset-1 dark:ring-[#A8B5A0] dark:ring-offset-[#151a16]',
                          )}
                        >
                          <CellContent
                            marked={marked}
                            finalized={finalized}
                            markLabel={markLabel}
                            pulsing={isNew}
                          />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
        <span>
          <span className="font-semibold text-[#3a463b]/85 dark:text-[#C7D3C1]/80">F</span> = marked by
          accepting status
        </span>
        <span>
          <span className="font-semibold text-[#3a463b]/85 dark:text-[#C7D3C1]/80">R2</span> = marked in
          refinement round 2
        </span>
        <span>Select any cell to inspect the pair.</span>
      </div>

      {selected && (
        <PairInspector
          analysis={analysis}
          dfa={dfa}
          pair={selected}
          markedNow={markedSet.has(selected.key)}
          finalized={finalized}
          isCurrent={currentKey === selected.key}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  )
}

function PairInspector({
  analysis,
  dfa,
  pair,
  markedNow,
  finalized,
  isCurrent,
  onClose,
}: {
  analysis: Analysis
  dfa: DFA
  pair: PairRecord
  markedNow: boolean
  finalized: boolean
  isCurrent: boolean
  onClose: () => void
}) {
  const info = analysis.marked[pair.key]
  const witness = analysis.valid ? shortestDistinguishingString(dfa, pair.a, pair.b) : null
  const status = markedNow
    ? info?.reason === 'finality'
      ? 'Distinguishable by accepting status'
      : `Distinguishable (round ${info?.round ?? '?'})`
    : finalized
      ? 'Equivalent — merge into one class'
      : isCurrent
        ? 'Currently being evaluated'
        : 'Still unmarked'

  return (
    <div className="animate-step mt-3 rounded-xl border border-[#C7D3C1] bg-[#F2F5EF]/80 p-3 dark:border-[#3a443a] dark:bg-[#263026]/50">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#292D29] dark:text-slate-100">
            <span className="font-mono">{formatPair(pair)}</span>
            <span
              className={cn(
                'chip !px-2 !py-0 !text-[10px]',
                markedNow
                  ? 'chip-rose'
                  : finalized
                    ? 'chip-emerald'
                    : 'chip-neutral',
              )}
            >
              {status}
            </span>
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
            {markedNow ? (
              info?.reason === 'finality' ? (
                <>
                  {pair.a} and {pair.b} disagree on accepting status, so the empty string ε already
                  separates them. One accepts immediately, the other rejects.
                </>
              ) : (
                <>
                  Some input symbol sends {pair.a} and {pair.b} into a pair that was already
                  distinguishable:
                  {info?.via ? (
                    <span className="mt-1 block font-mono text-[11px] text-[#292D29]/80 dark:text-slate-200">
                      on {info.via.symbol}: δ({pair.a}, {info.via.symbol}) = {info.via.dest1} and δ(
                      {pair.b}, {info.via.symbol}) = {info.via.dest2} →{' '}
                      {info.via.destPair
                        ? formatPair(info.via.destPair)
                        : `${info.via.dest1}, ${info.via.dest2}`}{' '}
                      was already marked.
                    </span>
                  ) : null}
                </>
              )
            ) : finalized ? (
              <>
                No input string distinguishes {pair.a} and {pair.b}. They accept exactly the same
                future strings, so they are merged into one equivalence class.
              </>
            ) : (
              <>
                The pair has not been marked yet. The walkthrough may still find a distinguishing
                symbol in a later round, so it is not safe to call it equivalent until the fixed
                point is reached.
              </>
            )}
          </p>
          {analysis.valid && witness && (
            <p className="mt-1.5 rounded-md border border-[#c9a79b] bg-[#f7ece7]/80 px-2 py-1.5 text-[11px] text-[#7c4232] dark:border-[#7c4232]/50 dark:bg-[#7c4232]/15 dark:text-[#e0b8a9]">
              Shortest witness:{' '}
              <span className="font-mono font-semibold">{witness.input || 'ε'}</span> — accepted from{' '}
              {witness.acceptedFromA ? pair.a : pair.b} but rejected from{' '}
              {witness.acceptedFromA ? pair.b : pair.a}.
            </p>
          )}
          {analysis.valid && !witness && markedNow && (
            <p className="mt-1.5 text-[11px] text-[#765c2e] dark:text-[#dcc295]">
              The witness search found no separating string, which should not happen for a marked
              pair. Please report this as a bug.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="icon-btn shrink-0"
          aria-label="Close pair details"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
