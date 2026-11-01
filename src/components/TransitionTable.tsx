import type { DFA, TransitionRef } from '../types/automata'
import { cn } from '../utils/cn'

interface TransitionTableProps {
  dfa: DFA
  title?: string
  /** Transitions to highlight (from + symbol + to). */
  highlight?: TransitionRef[]
  /** Rows to highlight (states involved in the current step or pair). */
  highlightStates?: string[]
  /** Rows that were removed (unreachable states). */
  removedStates?: string[]
  /** Compact variant for previews. */
  compact?: boolean
  className?: string
}

function refKey(ref: TransitionRef): string {
  return `${ref.from}\u0001${ref.symbol}\u0001${ref.to}`
}

/**
 * Read-only transition table used for the original DFA, the minimized DFA and
 * the practice challenge sheets. Rows keep the user's declaration order.
 */
export function TransitionTable({
  dfa,
  title,
  highlight,
  highlightStates,
  removedStates,
  compact,
  className,
}: TransitionTableProps) {
  const highlightSet = new Set((highlight ?? []).map(refKey))
  const stateSet = new Set(highlightStates ?? [])
  const removedSet = new Set(removedStates ?? [])

  return (
    <div className={cn('min-w-0', className)}>
      {title && (
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className={cn('w-full border-collapse text-left', compact ? 'text-[11px]' : 'text-xs')}>
          <thead>
            <tr>
              <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                State
              </th>
              {dfa.alphabet.map((symbol) => (
                <th
                  key={symbol}
                  className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 px-2.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                >
                  {symbol}
                </th>
              ))}
              <th className="whitespace-nowrap border-b border-slate-200 bg-slate-50/90 px-2.5 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {dfa.states.map((state) => {
              const isInitial = state === dfa.initialState
              const isFinal = dfa.finalStates.includes(state)
              const isRemoved = removedSet.has(state)
              const rowHighlighted = stateSet.has(state)
              return (
                <tr
                  key={state}
                  className={cn(
                    'transition-colors',
                    rowHighlighted && 'bg-indigo-50/70 dark:bg-indigo-500/10',
                    isRemoved && 'opacity-45',
                  )}
                >
                  <th
                    scope="row"
                    className="whitespace-nowrap border-b border-slate-100 px-2.5 py-1.5 text-left font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100"
                  >
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'inline-flex w-4 shrink-0 justify-center text-[11px]',
                          isInitial ? 'text-indigo-600 dark:text-indigo-400' : 'text-transparent',
                        )}
                        aria-hidden="true"
                      >
                        →
                      </span>
                      <span className={cn(isRemoved && 'line-through')}>{state}</span>
                      {isFinal && (
                        <span
                          className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-500 text-[8px] font-bold leading-none text-slate-500 dark:border-slate-400 dark:text-slate-300"
                          title="Accepting state"
                          aria-label="Accepting state"
                        >
                          ◎
                        </span>
                      )}
                    </span>
                  </th>
                  {dfa.alphabet.map((symbol) => {
                    const destination = dfa.transitions[state]?.[symbol]
                    const active =
                      destination !== undefined &&
                      highlightSet.has(`${state}\u0001${symbol}\u0001${destination}`)
                    return (
                      <td
                        key={symbol}
                        className={cn(
                          'border-b border-slate-100 px-2.5 py-1.5 text-center font-mono text-[11px] dark:border-slate-800',
                          active &&
                            'bg-indigo-100 font-bold text-indigo-800 ring-1 ring-inset ring-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-indigo-500/40',
                          destination === undefined && 'text-rose-600 dark:text-rose-400',
                        )}
                      >
                        {destination ?? 'undefined'}
                      </td>
                    )
                  })}
                  <td className="whitespace-nowrap border-b border-slate-100 px-2.5 py-1.5 text-center dark:border-slate-800">
                    <span className="inline-flex flex-wrap justify-center gap-1">
                      {isInitial && (
                        <span className="chip chip-indigo !px-1.5 !py-0 !text-[9px]">start</span>
                      )}
                      {isFinal && (
                        <span className="chip chip-emerald !px-1.5 !py-0 !text-[9px]">final</span>
                      )}
                      {isRemoved && (
                        <span className="chip chip-neutral !px-1.5 !py-0 !text-[9px]">removed</span>
                      )}
                      {!isInitial && !isFinal && !isRemoved && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">normal</span>
                      )}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
