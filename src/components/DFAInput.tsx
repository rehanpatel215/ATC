import { useMemo, useState } from 'react'
import {
  BookOpen,
  Check,
  CircleDot,
  Info,
  Plus,
  RotateCcw,
  Sparkles,
  Table2,
  Trash,
  TriangleAlert,
  Workflow,
  X,
} from 'lucide-react'
import type { DFA } from '../types/automata'
import { findReachable } from '../algorithms/reachability'
import { validateDFA } from '../algorithms/validation'
import {
  addState,
  addSymbol,
  nextStateName,
  nextSymbolName,
  removeState,
  removeSymbol,
  renameState,
  setInitialState,
  setSymbol,
  setTransition,
  toggleFinalState,
} from '../utils/automataHelpers'
import { cn } from '../utils/cn'
import { GraphBuilder } from './GraphBuilder'
import { InlineInput } from './InlineInput'

interface DFAInputProps {
  dfa: DFA
  onChange: (dfa: DFA) => void
  onReset: () => void
  onLoadStarter: () => void
  onLoadExample: () => void
  sourceLabel: string
  resetLabel: string
  defaultTab?: InputMode
}

type InputMode = 'table' | 'graph'

const MAX_STATES = 16

/**
 * The manual input workspace. State names, accepting status, the alphabet and
 * every transition are edited directly; validation runs on each change and the
 * same DFA object feeds both the transition table and the graph editor.
 */
export function DFAInput({
  dfa,
  onChange,
  onReset,
  onLoadStarter,
  onLoadExample,
  sourceLabel,
  resetLabel,
  defaultTab = 'table',
}: DFAInputProps) {
  const [mode, setMode] = useState<InputMode>(defaultTab)
  const validation = useMemo(() => validateDFA(dfa), [dfa])
  const unreachable = useMemo(() => {
    if (!validation.valid) return []
    return findReachable(dfa).unreachable
  }, [dfa, validation.valid])

  const setStateCount = (raw: number) => {
    if (!Number.isFinite(raw)) return
    const target = Math.max(1, Math.min(MAX_STATES, Math.round(raw)))
    let next = dfa
    if (target > next.states.length) {
      for (let index = next.states.length; index < target; index += 1) {
        next = addState(next, nextStateName(new Set(next.states)))
      }
    } else if (target < next.states.length) {
      while (next.states.length > target) {
        next = removeState(next, next.states[next.states.length - 1])
      }
    }
    if (next !== dfa) onChange(next)
  }

  return (
    <div className="app-card overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="card-title">DFA input</h2>
            <p className="card-subtitle mt-0.5">{sourceLabel}</p>
          </div>
          <span
            className={cn(
              'chip !py-0.5 !text-[10px]',
              validation.valid ? 'chip-emerald' : 'chip-rose',
            )}
          >
            {validation.valid ? 'complete' : `${validation.errors.length} error${validation.errors.length === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="mt-2.5 flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setMode('table')}
            aria-pressed={mode === 'table'}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
              mode === 'table'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
            Transition table
          </button>
          <button
            type="button"
            onClick={() => setMode('graph')}
            aria-pressed={mode === 'graph'}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
              mode === 'graph'
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
            )}
          >
            <Workflow className="h-3.5 w-3.5" aria-hidden="true" />
            Graph builder
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-2 dark:border-slate-800">
        <button type="button" onClick={onLoadStarter} className="btn btn-secondary btn-sm">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          Starter
        </button>
        <button type="button" onClick={onLoadExample} className="btn btn-secondary btn-sm">
          <BookOpen className="h-3 w-3" aria-hidden="true" />
          Example
        </button>
        <button type="button" onClick={onReset} className="btn btn-ghost btn-sm ml-auto">
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          {resetLabel}
        </button>
      </div>

      <div className="card-pad">
        {mode === 'graph' ? (
          <GraphBuilder dfa={dfa} onChange={onChange} />
        ) : (
          <div className="space-y-4">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  States ({dfa.states.length})
                </h3>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Number of states
                    <input
                      type="number"
                      min={1}
                      max={MAX_STATES}
                      value={dfa.states.length}
                      onChange={(event) => setStateCount(Number(event.target.value))}
                      className="input !w-16 !py-1 !text-center !text-[11px]"
                      aria-label="Number of states"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange(addState(dfa, nextStateName(new Set(dfa.states))))}
                    disabled={dfa.states.length >= MAX_STATES}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus className="h-3 w-3" aria-hidden="true" />
                    Add
                  </button>
                </div>
              </div>

              <p className="mt-1 text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
                Names must be unique and cannot contain commas, brackets or parentheses. Click a
                name to rename it, ◉ to make it initial, ✓ to toggle accepting.
              </p>

              <div className="mt-2 max-h-[210px] space-y-1 overflow-y-auto pr-1">
                {dfa.states.map((state) => {
                  const isInitial = state === dfa.initialState
                  const isFinal = dfa.finalStates.includes(state)
                  return (
                    <div
                      key={state}
                      className="flex items-center gap-1 rounded-md border border-transparent px-1 py-0.5 hover:border-slate-200 hover:bg-slate-50/70 dark:hover:border-slate-700 dark:hover:bg-slate-800/40"
                    >
                      <button
                        type="button"
                        onClick={() => onChange(setInitialState(dfa, state))}
                        aria-pressed={isInitial}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 transition-colors hover:border-indigo-400 dark:border-slate-600 dark:text-slate-500"
                        title={isInitial ? 'Initial state' : 'Make initial state'}
                        aria-label={`Make ${state} the initial state`}
                      >
                        <CircleDot
                          className={cn('h-3 w-3', isInitial && 'text-indigo-600 dark:text-indigo-400')}
                          aria-hidden="true"
                        />
                      </button>
                      <InlineInput
                        value={state}
                        ariaLabel={`Name of state ${state}`}
                        onCommit={(next) => onChange(renameState(dfa, state, next))}
                        className="flex-1"
                      />
                      {isInitial && (
                        <span className="chip chip-indigo !px-1.5 !py-0 !text-[9px]">start</span>
                      )}
                      <button
                        type="button"
                        onClick={() => onChange(toggleFinalState(dfa, state))}
                        aria-pressed={isFinal}
                        className={cn(
                          'icon-btn !h-6 !w-6',
                          isFinal &&
                            'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
                        )}
                        title={isFinal ? 'Remove accepting status' : 'Mark as accepting'}
                        aria-label={
                          isFinal
                            ? `Remove accepting status from ${state}`
                            : `Mark ${state} as accepting`
                        }
                      >
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(removeState(dfa, state))}
                        disabled={dfa.states.length <= 1}
                        className="icon-btn !h-6 !w-6 hover:text-rose-600 dark:hover:text-rose-400"
                        title="Delete state"
                        aria-label={`Delete state ${state}`}
                      >
                        <Trash className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  Alphabet ({dfa.alphabet.length})
                </h3>
                <button
                  type="button"
                  onClick={() => onChange(addSymbol(dfa, nextSymbolName(new Set(dfa.alphabet))))}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  Add symbol
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {dfa.alphabet.map((symbol, index) => (
                  <div
                    key={`${symbol}-${index}`}
                    className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white pl-1 pr-0.5 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <InlineInput
                      value={symbol}
                      ariaLabel={`Alphabet symbol ${symbol}`}
                      onCommit={(next) => onChange(setSymbol(dfa, index, next))}
                      className="!w-12 !text-center"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={() => onChange(removeSymbol(dfa, symbol))}
                      disabled={dfa.alphabet.length <= 1}
                      className="icon-btn !h-6 !w-6 hover:text-rose-600 dark:hover:text-rose-400"
                      title={`Delete symbol ${symbol}`}
                      aria-label={`Delete symbol ${symbol}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Transition function δ
              </h3>
              <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                Every state needs exactly one destination per symbol. Choose a destination to update
                the table instantly.
              </p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr>
                      <th className="border-b border-slate-200 bg-slate-50/90 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
                        State
                      </th>
                      {dfa.alphabet.map((symbol) => (
                        <th
                          key={symbol}
                          className="border-b border-slate-200 bg-slate-50/90 px-1.5 py-1.5 text-center font-mono text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400"
                        >
                          {symbol}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dfa.states.map((state) => (
                      <tr key={state} className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-transparent dark:even:bg-slate-900/30">
                        <th
                          scope="row"
                          className="whitespace-nowrap border-b border-slate-100 px-2 py-1 text-left font-mono text-[11px] font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100"
                        >
                          {state === dfa.initialState && (
                            <span className="mr-1 text-indigo-600 dark:text-indigo-400" aria-label="initial">
                              →
                            </span>
                          )}
                          {state}
                          {dfa.finalStates.includes(state) && (
                            <span className="ml-1 text-[9px] text-emerald-600 dark:text-emerald-400" aria-label="accepting">
                              ◎
                            </span>
                          )}
                        </th>
                        {dfa.alphabet.map((symbol) => {
                          const destination = dfa.transitions[state]?.[symbol]
                          return (
                            <td
                              key={symbol}
                              className="border-b border-slate-100 px-1 py-1 dark:border-slate-800"
                            >
                              <select
                                value={destination ?? ''}
                                onChange={(event) =>
                                  onChange(setTransition(dfa, state, symbol, event.target.value))
                                }
                                aria-label={`Destination of ${state} on ${symbol}`}
                                className={cn(
                                  'select !px-1.5 !py-1 text-center font-mono !text-[11px]',
                                  destination === undefined &&
                                    'border-rose-300 text-rose-600 dark:border-rose-500/40 dark:text-rose-400',
                                )}
                              >
                                {destination === undefined && (
                                  <option value="" disabled>
                                    —
                                  </option>
                                )}
                                {dfa.states.map((target) => (
                                  <option key={target} value={target}>
                                    {target}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        <div className="mt-4 space-y-1.5">
          {validation.errors.length > 0 && (
            <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-2 dark:border-rose-500/30 dark:bg-rose-500/10">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300">
                <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                {validation.errors.length} validation error
                {validation.errors.length === 1 ? '' : 's'}
              </p>
              <ul className="mt-1 space-y-0.5">
                {validation.errors.map((error) => (
                  <li
                    key={error}
                    className="flex gap-1.5 text-[11px] leading-relaxed text-rose-800 dark:text-rose-200"
                  >
                    <span aria-hidden="true">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.valid && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">Valid DFA.</span>
              <span>
                {dfa.states.length} states, {dfa.states.length * dfa.alphabet.length} transitions,{' '}
                {dfa.finalStates.length} accepting.
              </span>
              {unreachable.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <Info className="h-3 w-3" aria-hidden="true" />
                  {unreachable.length} unreachable: {unreachable.join(', ')} (removed during minimization)
                </span>
              )}
            </div>
          )}

          {validation.valid &&
            validation.warnings.map((warning) => (
              <p
                key={warning}
                className="flex gap-1.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
              >
                <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                {warning}
              </p>
            ))}
        </div>
      </div>
    </div>
  )
}
