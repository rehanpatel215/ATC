import { useMemo, useState } from 'react'
import { Check, CircleDot, Plus, Trash, Workflow, X } from 'lucide-react'
import type { DFA } from '../types/automata'
import {
  addState,
  addSymbol,
  deleteTransition,
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
import { DFAGraph } from './DFAGraph'
import { InlineInput } from './InlineInput'

interface GraphBuilderProps {
  dfa: DFA
  onChange: (dfa: DFA) => void
}

/**
 * Interactive graph-based DFA editor. The graph, the state list, the alphabet
 * editor and the explicit transition form all write to the same DFA object, so
 * the two input modes can never disagree.
 */
export function GraphBuilder({ dfa, onChange }: GraphBuilderProps) {
  const [selectedState, setSelectedState] = useState<string | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<{ from: string; to: string } | null>(null)
  const [connectSymbol, setConnectSymbol] = useState(dfa.alphabet[0] ?? '')
  const [formFrom, setFormFrom] = useState(dfa.initialState)
  const [formSymbol, setFormSymbol] = useState(dfa.alphabet[0] ?? '')
  const [formTo, setFormTo] = useState(dfa.initialState)

  const activeState =
    selectedState && dfa.states.includes(selectedState) ? selectedState : null
  const activeEdge =
    selectedEdge &&
    dfa.states.includes(selectedEdge.from) &&
    dfa.states.includes(selectedEdge.to)
      ? selectedEdge
      : null

  const symbol = dfa.alphabet.includes(connectSymbol) ? connectSymbol : (dfa.alphabet[0] ?? '')
  const from = dfa.states.includes(formFrom) ? formFrom : dfa.initialState
  const to = dfa.states.includes(formTo) ? formTo : dfa.initialState
  const formInputSymbol = dfa.alphabet.includes(formSymbol)
    ? formSymbol
    : (dfa.alphabet[0] ?? '')

  const outgoing = useMemo(() => {
    if (!activeState) return []
    return dfa.alphabet.map((entry) => ({
      symbol: entry,
      destination: dfa.transitions[activeState]?.[entry],
    }))
  }, [activeState, dfa.alphabet, dfa.transitions])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            const name = nextStateName(new Set(dfa.states))
            onChange(addState(dfa, name))
            setSelectedState(name)
            setSelectedEdge(null)
          }}
          className="btn btn-secondary btn-sm"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add state
        </button>
        <button
          type="button"
          onClick={() => onChange(addSymbol(dfa, nextSymbolName(new Set(dfa.alphabet))))}
          className="btn btn-secondary btn-sm"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add symbol
        </button>
        <span className="ml-auto text-[10px] text-slate-500 dark:text-slate-400">
          {dfa.states.length} states · alphabet {`{${dfa.alphabet.join(', ')}}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/40">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Workflow className="h-3 w-3" aria-hidden="true" />
          New transition symbol
        </span>
        {dfa.alphabet.map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setConnectSymbol(entry)}
            aria-pressed={symbol === entry}
            className={cn(
              'rounded border px-2 py-0.5 font-mono text-[10px] font-bold transition-colors',
              symbol === entry
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
            )}
          >
            {entry}
          </button>
        ))}
        <span className="text-[10px] text-slate-400 dark:text-slate-500">
          drag between node handles, or use the form below
        </span>
      </div>

      <DFAGraph
        dfa={dfa}
        height={360}
        connectable
        showReachability={false}
        selectedState={activeState}
        selectedEdge={activeEdge}
        onStateClick={(state) => {
          setSelectedState(state)
          setSelectedEdge(null)
          setFormFrom(state)
        }}
        onEdgeSelect={(edgeFrom, edgeTo) => {
          setSelectedEdge({ from: edgeFrom, to: edgeTo })
          setSelectedState(null)
          setFormFrom(edgeFrom)
          setFormTo(edgeTo)
        }}
        onPaneClick={() => {
          setSelectedState(null)
          setSelectedEdge(null)
        }}
        onConnect={(edgeFrom, edgeTo) => {
          if (!symbol) return
          onChange(setTransition(dfa, edgeFrom, symbol, edgeTo))
          setSelectedEdge({ from: edgeFrom, to: edgeTo })
          setSelectedState(null)
        }}
        emptyMessage="Add a state to start building the graph."
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              States
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">click to inspect</span>
          </div>
          <div className="max-h-[220px] overflow-y-auto p-1.5">
            {dfa.states.map((state) => {
              const isInitial = state === dfa.initialState
              const isFinal = dfa.finalStates.includes(state)
              return (
                <div
                  key={state}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-1 py-0.5 transition-colors',
                    activeState === state
                      ? 'bg-indigo-50 dark:bg-indigo-500/10'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onChange(setInitialState(dfa, state))}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 transition-colors hover:border-indigo-400 dark:border-slate-600 dark:text-slate-500"
                    title={isInitial ? 'Initial state' : 'Make initial state'}
                    aria-label={`Make ${state} the initial state`}
                    aria-pressed={isInitial}
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
                  {isInitial && <span className="chip chip-indigo !px-1.5 !py-0 !text-[9px]">start</span>}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedState(state)
                      setSelectedEdge(null)
                      setFormFrom(state)
                    }}
                    className="icon-btn !h-6 !w-6"
                    title="Inspect transitions"
                    aria-label={`Inspect transitions from ${state}`}
                  >
                    <Workflow className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(toggleFinalState(dfa, state))}
                    className={cn(
                      'icon-btn !h-6 !w-6',
                      isFinal && 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
                    )}
                    title={isFinal ? 'Remove accepting status' : 'Mark as accepting'}
                    aria-label={isFinal ? `Remove accepting status from ${state}` : `Mark ${state} as accepting`}
                    aria-pressed={isFinal}
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
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Alphabet
            </p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {dfa.alphabet.length} symbol{dfa.alphabet.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="max-h-[220px] space-y-1 overflow-y-auto p-1.5">
            {dfa.alphabet.map((entry, index) => (
              <div
                key={`${entry}-${index}`}
                className="flex items-center gap-1 rounded-md px-1 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                <span className="w-5 shrink-0 text-center text-[10px] text-slate-400 dark:text-slate-500">
                  {index + 1}
                </span>
                <InlineInput
                  value={entry}
                  ariaLabel={`Alphabet symbol ${entry}`}
                  onCommit={(next) => onChange(setSymbol(dfa, index, next))}
                  className="flex-1"
                  maxLength={4}
                />
                <button
                  type="button"
                  onClick={() => onChange(removeSymbol(dfa, entry))}
                  disabled={dfa.alphabet.length <= 1}
                  className="icon-btn !h-6 !w-6 hover:text-rose-600 dark:hover:text-rose-400"
                  title="Delete symbol"
                  aria-label={`Delete symbol ${entry}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => onChange(addSymbol(dfa, nextSymbolName(new Set(dfa.alphabet))))}
              className="btn btn-ghost btn-sm !w-full !justify-start"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
              Add symbol
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2 dark:border-slate-800">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {activeState
              ? `Transitions from ${activeState}`
              : activeEdge
                ? `Edge ${activeEdge.from} → ${activeEdge.to}`
                : 'Add a transition'}
          </p>
          {(activeState || activeEdge) && (
            <button
              type="button"
              onClick={() => {
                setSelectedState(null)
                setSelectedEdge(null)
              }}
              className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
            >
              clear selection
            </button>
          )}
        </div>

        <div className="p-2.5">
          {activeState && (
            <div className="mb-2.5 space-y-1">
              {outgoing.map((entry) => (
                <div key={entry.symbol} className="flex items-center gap-1.5">
                  <span className="w-14 shrink-0 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-center font-mono text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    on {entry.symbol}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">→</span>
                  <select
                    value={entry.destination ?? ''}
                    onChange={(event) =>
                      onChange(setTransition(dfa, activeState, entry.symbol, event.target.value))
                    }
                    className="select !py-1 !text-[11px]"
                    aria-label={`Destination for ${activeState} on ${entry.symbol}`}
                  >
                    {entry.destination === undefined && (
                      <option value="" disabled>
                        undefined
                      </option>
                    )}
                    {dfa.states.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onChange(deleteTransition(dfa, activeState, entry.symbol))}
                    className="icon-btn !h-6 !w-6 hover:text-rose-600 dark:hover:text-rose-400"
                    title="Delete transition"
                    aria-label={`Delete transition from ${activeState} on ${entry.symbol}`}
                  >
                    <Trash className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
              <p className="pt-1 text-[10px] text-slate-400 dark:text-slate-500">
                Deleting a transition leaves the DFA incomplete; validation explains what is missing.
              </p>
            </div>
          )}

          {!activeState && activeEdge && (
            <div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="font-mono font-semibold">
                {activeEdge.from} → {activeEdge.to}
              </span>
              <span className="text-slate-400 dark:text-slate-500">carries</span>
              {dfa.alphabet
                .filter((entry) => dfa.transitions[activeEdge.from]?.[entry] === activeEdge.to)
                .map((entry) => (
                  <span
                    key={entry}
                    className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {entry}
                  </span>
                ))}
              <button
                type="button"
                onClick={() => {
                  let next = dfa
                  for (const entry of dfa.alphabet) {
                    if (dfa.transitions[activeEdge.from]?.[entry] === activeEdge.to) {
                      next = deleteTransition(next, activeEdge.from, entry)
                    }
                  }
                  onChange(next)
                  setSelectedEdge(null)
                }}
                className="btn btn-danger btn-sm ml-auto"
              >
                <Trash className="h-3 w-3" aria-hidden="true" />
                Delete edge
              </button>
            </div>
          )}

          <div className="mt-1 grid grid-cols-2 items-end gap-1.5 sm:grid-cols-[1fr_auto_1fr_auto]">
            <label className="block">
              <span className="field-label">From</span>
              <select
                value={from}
                onChange={(event) => setFormFrom(event.target.value)}
                className="select !py-1 !text-[11px]"
              >
                {dfa.states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">Symbol</span>
              <select
                value={formInputSymbol}
                onChange={(event) => setFormSymbol(event.target.value)}
                className="select !py-1 !text-[11px]"
              >
                {dfa.alphabet.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">To</span>
              <select
                value={to}
                onChange={(event) => setFormTo(event.target.value)}
                className="select !py-1 !text-[11px]"
              >
                {dfa.states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => onChange(setTransition(dfa, from, formInputSymbol, to))}
              disabled={!formInputSymbol}
              className="btn btn-primary btn-sm"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
