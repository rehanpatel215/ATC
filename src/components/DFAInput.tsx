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
      <div className="border-b border-[#C7D3C1]/60 px-4 py-3 dark:border-[#333c34]">
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

        <div className="mt-2.5 flex rounded-md border border-[#C7D3C1] bg-[#F2F5EF] p-0.5 dark:border-[#3a443a] dark:bg-[#1b211c]">
          <button
            type="button"
            onClick={() => setMode('table')}
            aria-pressed={mode === 'table'}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-semibold transition-colors',
              mode === 'table'
                ? 'bg-[#FAFAF7] text-[#465447] shadow-sm dark:bg-[#263026] dark:text-[#C7D3C1]'
                : 'text-[#3a463b]/75 hover:text-[#292D29] dark:text-[#C7D3C1]/70 dark:hover:text-[#F2F5EF]',
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
              'flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-semibold transition-colors',
              mode === 'graph'
                ? 'bg-[#FAFAF7] text-[#465447] shadow-sm dark:bg-[#263026] dark:text-[#C7D3C1]'
                : 'text-[#3a463b]/75 hover:text-[#292D29] dark:text-[#C7D3C1]/70 dark:hover:text-[#F2F5EF]',
            )}
          >
            <Workflow className="h-3.5 w-3.5" aria-hidden="true" />
            Graph builder
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[#C7D3C1]/60 px-4 py-2 dark:border-[#333c34]">
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
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/80 dark:text-[#C7D3C1]/70">
                  States ({dfa.states.length})
                </h3>
                <div className="flex items-center gap-1.5">
                  <label className="flex items-center gap-1 text-[10px] font-medium text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
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

              <p className="mt-1 text-[10px] leading-relaxed text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
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
                      className="flex items-center gap-1 rounded-md border border-transparent px-1 py-0.5 hover:border-[#C7D3C1] hover:bg-[#F2F5EF]/70 dark:hover:border-[#3a443a] dark:hover:bg-[#263026]/60"
                    >
                      <button
                        type="button"
                        onClick={() => onChange(setInitialState(dfa, state))}
                        aria-pressed={isInitial}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C7D3C1] text-[#3a463b]/75 transition-colors hover:border-[#465447] dark:border-[#3a443a] dark:text-[#C7D3C1]/70"
                        title={isInitial ? 'Initial state' : 'Make initial state'}
                        aria-label={`Make ${state} the initial state`}
                      >
                        <CircleDot
                          className={cn('h-3 w-3', isInitial && 'text-[#465447] dark:text-[#A8B5A0]')}
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
                            'bg-[#e7ede3] text-[#3e4c3f] dark:bg-[#A8B5A0]/15 dark:text-[#C7D3C1]',
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
                        className="icon-btn !h-6 !w-6 hover:text-[#7c4232] dark:hover:text-[#e0b8a9]"
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
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/80 dark:text-[#C7D3C1]/70">
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
                    className="flex items-center gap-0.5 rounded-md border border-[#C7D3C1] bg-[#FAFAF7] pl-1 pr-0.5 dark:border-[#3a443a] dark:bg-[#1b211c]"
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
                      className="icon-btn !h-6 !w-6 hover:text-[#7c4232] dark:hover:text-[#e0b8a9]"
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
              <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/80 dark:text-[#C7D3C1]/70">
                Transition function δ
              </h3>
              <p className="mt-1 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                Every state needs exactly one destination per symbol. Choose a destination to update
                the table instantly.
              </p>
              <div className="mt-2 overflow-x-auto rounded-lg border border-[#C7D3C1] dark:border-[#3a443a]">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr>
                      <th className="border-b border-[#C7D3C1] bg-[#F2F5EF] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#3a463b]/80 dark:border-[#3a443a] dark:bg-[#263026] dark:text-[#C7D3C1]/70">
                        State
                      </th>
                      {dfa.alphabet.map((symbol) => (
                        <th
                          key={symbol}
                          className="border-b border-[#C7D3C1] bg-[#F2F5EF] px-1.5 py-1.5 text-center font-mono text-[10px] font-semibold text-[#3a463b]/80 dark:border-[#3a443a] dark:bg-[#263026] dark:text-[#C7D3C1]/70"
                        >
                          {symbol}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dfa.states.map((state) => (
                      <tr key={state} className="odd:bg-[#FAFAF7] even:bg-[#F2F5EF]/40 dark:odd:bg-transparent dark:even:bg-[#263026]/30">
                        <th
                          scope="row"
                          className="whitespace-nowrap border-b border-[#C7D3C1]/60 px-2 py-1 text-left font-mono text-[11px] font-semibold text-[#292D29] dark:border-[#333c34] dark:text-slate-100"
                        >
                          {state === dfa.initialState && (
                            <span className="mr-1 text-[#465447] dark:text-[#A8B5A0]" aria-label="initial">
                              →
                            </span>
                          )}
                          {state}
                          {dfa.finalStates.includes(state) && (
                            <span className="ml-1 text-[9px] text-[#3e4c3f] dark:text-[#C7D3C1]" aria-label="accepting">
                              ◎
                            </span>
                          )}
                        </th>
                        {dfa.alphabet.map((symbol) => {
                          const destination = dfa.transitions[state]?.[symbol]
                          return (
                            <td
                              key={symbol}
                              className="border-b border-[#C7D3C1]/60 px-1 py-1 dark:border-[#333c34]"
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
                                    'border-[#c9a79b] text-[#7c4232] dark:border-[#7c4232]/50 dark:text-[#e0b8a9]',
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
            <div className="rounded-lg border border-[#c9a79b] bg-[#f7ece7]/80 px-2.5 py-2 dark:border-[#7c4232]/50 dark:bg-[#7c4232]/15">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#7c4232] dark:text-[#e0b8a9]">
                <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                {validation.errors.length} validation error
                {validation.errors.length === 1 ? '' : 's'}
              </p>
              <ul className="mt-1 space-y-0.5">
                {validation.errors.map((error) => (
                  <li
                    key={error}
                    className="flex gap-1.5 text-[11px] leading-relaxed text-[#7c4232] dark:text-[#e0b8a9]"
                  >
                    <span aria-hidden="true">•</span>
                    <span>{error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {validation.valid && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[#A8B5A0] bg-[#e7ede3]/70 px-2.5 py-1.5 text-[11px] text-[#3e4c3f] dark:border-[#A8B5A0]/35 dark:bg-[#A8B5A0]/12 dark:text-[#C7D3C1]">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="font-semibold">Valid DFA.</span>
              <span>
                {dfa.states.length} states, {dfa.states.length * dfa.alphabet.length} transitions,{' '}
                {dfa.finalStates.length} accepting.
              </span>
              {unreachable.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded border border-[#d8c39b] bg-[#f6efdf] px-1.5 py-0.5 text-[10px] font-medium text-[#765c2e] dark:border-[#8a6d38]/50 dark:bg-[#8a6d38]/15 dark:text-[#dcc295]">
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
                className="flex gap-1.5 rounded-lg border border-[#d8c39b] bg-[#f6efdf]/70 px-2.5 py-1.5 text-[11px] leading-relaxed text-[#765c2e] dark:border-[#8a6d38]/50 dark:bg-[#8a6d38]/15 dark:text-[#dcc295]"
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
