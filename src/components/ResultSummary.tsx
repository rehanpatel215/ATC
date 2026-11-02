import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CircleCheck,
  Download,
  FileSpreadsheet,
  Image,
  Layers,
  Printer,
  TriangleAlert,
} from 'lucide-react'
import type { DFA } from '../types/automata'
import type { Analysis } from '../types/simulation'
import {
  buildDfaSvg,
  downloadCsv,
  downloadPng,
  downloadSvg,
  printSummary,
  safeName,
} from '../utils/exportHelpers'
import { formatPair, formatSet } from '../utils/automataHelpers'
import { groupBadge, groupColor } from '../utils/colors'
import { cn } from '../utils/cn'
import { DFAGraph } from './DFAGraph'
import { TransitionTable } from './TransitionTable'

interface ResultSummaryProps {
  analysis: Analysis
  dfa: DFA
  sourceLabel: string
  title?: string
}

function Stat({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  tone?: 'default' | 'accent' | 'good' | 'warn'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-2.5 py-2',
        tone === 'accent'
          ? 'border-[#A8B5A0]/70 bg-[#e7ede3]/70 dark:border-[#A8B5A0]/35 dark:bg-[#A8B5A0]/12'
          : tone === 'good'
            ? 'border-[#A8B5A0] bg-[#e7ede3] dark:border-[#A8B5A0]/40 dark:bg-[#A8B5A0]/15'
            : tone === 'warn'
              ? 'border-[#d8c39b] bg-[#f6efdf] dark:border-[#8a6d38]/50 dark:bg-[#8a6d38]/15'
              : 'border-[#C7D3C1]/70 bg-[#F2F5EF]/70 dark:border-[#3a443a] dark:bg-[#263026]/50',
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-lg font-bold leading-none text-[#292D29] dark:text-slate-50">
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] leading-tight text-[#3a463b]/75 dark:text-[#C7D3C1]/70">{hint}</p>}
    </div>
  )
}

function ExportButtons({ dfa, base, label }: { dfa: DFA; base: string; label: string }) {
  const [error, setError] = useState<string | null>(null)
  const file = `${base}-${label.toLowerCase()}`

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => downloadCsv(dfa, `${file}.csv`)}
        className="btn btn-secondary btn-sm"
        title={`Download the ${label} transition table as CSV`}
      >
        <FileSpreadsheet className="h-3 w-3" aria-hidden="true" />
        CSV
      </button>
      <button
        type="button"
        onClick={() => downloadSvg(dfa, `${file}.svg`)}
        className="btn btn-secondary btn-sm"
        title={`Download the ${label} DFA diagram as SVG`}
      >
        <Image className="h-3 w-3" aria-hidden="true" />
        SVG
      </button>
      <button
        type="button"
        onClick={() => {
          setError(null)
          void downloadPng(dfa, `${file}.png`).catch((reason: unknown) => {
            setError(reason instanceof Error ? reason.message : 'PNG export failed.')
          })
        }}
        className="btn btn-secondary btn-sm"
        title={`Download the ${label} DFA diagram as PNG`}
      >
        <Download className="h-3 w-3" aria-hidden="true" />
        PNG
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-[10px] text-[#7c4232] dark:text-[#e0b8a9]">
          <TriangleAlert className="h-3 w-3" aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * Final report. Every number here is read from the analysis object — nothing
 * is hardcoded. The hidden `.print-report` block is what the browser prints or
 * saves as a PDF.
 */
export function ResultSummary({ analysis, dfa, sourceLabel, title }: ResultSummaryProps) {
  const minimized = analysis.minimized
  const groups = analysis.build?.groups ?? []
  const base = safeName(sourceLabel || 'automatalab')
  const originalSvg = useMemo(() => buildDfaSvg(dfa, { theme: 'light', background: true }), [dfa])
  const minimizedSvg = useMemo(
    () => (minimized ? buildDfaSvg(minimized, { theme: 'light', background: true }) : ''),
    [minimized],
  )
  const [generatedAt] = useState(() => new Date().toLocaleString())

  if (!minimized) return null

  const removed = analysis.unreachable.length
  const pairs = analysis.pairs.length
  const markedPairs = pairs - analysis.equivalentPairs.length
  const markingRounds = analysis.table?.markingRounds ?? 0
  const delta = analysis.orderedReachable.length - minimized.states.length

  return (
    <section className="app-card overflow-hidden" id="result-summary">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#C7D3C1]/60 px-4 py-3 dark:border-[#333c34]">
        <div>
          <p className="eyebrow">Result summary</p>
          <h2 className="mt-0.5 font-serif text-xl font-semibold tracking-tight text-[#292D29] dark:text-[#F2F5EF]">
            {title ?? 'Original DFA → minimized DFA'}
          </h2>
          <p className="card-subtitle mt-0.5">
            {sourceLabel} · the walkthrough finished at a fixed point, so the table below is final.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {delta > 0 ? (
            <span className="chip chip-emerald">
              <CircleCheck className="h-3 w-3" aria-hidden="true" />
              {delta} state{delta === 1 ? '' : 's'} merged
            </span>
          ) : (
            <span className="chip chip-neutral">already minimal</span>
          )}
          <button type="button" onClick={printSummary} className="btn btn-primary btn-sm">
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            Print / PDF
          </button>
        </div>
      </div>

      <div className="card-pad space-y-5">
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Original states" value={dfa.states.length} />
          <Stat
            label="Reachable"
            value={analysis.orderedReachable.length}
            hint={removed > 0 ? `${removed} removed` : 'all reachable'}
            tone="accent"
          />
          <Stat label="Unreachable removed" value={removed} tone={removed > 0 ? 'warn' : 'default'} />
          <Stat label="State pairs" value={pairs} hint={`${markedPairs} distinguishable`} />
          <Stat label="Equivalent pairs" value={analysis.equivalentPairs.length} tone="good" />
          <Stat
            label="Minimized states"
            value={minimized.states.length}
            hint={delta > 0 ? `−${delta} from reachable` : 'no reduction'}
            tone="good"
          />
          <Stat label="Accepting (minimized)" value={minimized.finalStates.length} />
          <Stat label="Equivalence groups" value={groups.length} />
          <Stat label="Marking rounds" value={markingRounds} hint="fixed point reached" />
          <Stat label="Recorded steps" value={analysis.steps.length} hint="replayable walkthrough" />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg border border-[#C7D3C1] p-2.5 dark:border-[#3a443a]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 pb-2">
              <div>
                <p className="text-[11px] font-semibold text-[#292D29] dark:text-slate-100">
                  Original DFA{' '}
                  <span className="font-normal text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                    ({dfa.states.length} states)
                  </span>
                </p>
                {removed > 0 && (
                  <p className="text-[10px] text-[#765c2e] dark:text-[#dcc295]">
                    Unreachable states are faded; they are excluded from the result.
                  </p>
                )}
              </div>
              <ExportButtons dfa={dfa} base={base} label="Original" />
            </div>
            <DFAGraph
              dfa={dfa}
              height={300}
              fadedStates={analysis.unreachable}
              groups={groups}
              showGroups
            />
          </div>

          <div className="rounded-lg border border-[#C7D3C1] p-2.5 dark:border-[#3a443a]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-0.5 pb-2">
              <div>
                <p className="text-[11px] font-semibold text-[#292D29] dark:text-slate-100">
                  Minimized DFA{' '}
                  <span className="font-normal text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                    ({minimized.states.length} states)
                  </span>
                </p>
                <p className="text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  Accepting: {formatSet(minimized.finalStates)} · initial: {minimized.initialState}
                </p>
              </div>
              <ExportButtons dfa={minimized} base={base} label="Minimized" />
            </div>
            <DFAGraph dfa={minimized} height={300} />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <TransitionTable
            dfa={dfa}
            title="Original transition table"
            removedStates={analysis.unreachable}
          />
          <TransitionTable dfa={minimized} title="Minimized transition table" />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-[#292D29] dark:text-slate-100">
              <Layers className="h-3.5 w-3.5 text-[#465447] dark:text-[#A8B5A0]" aria-hidden="true" />
              Equivalent-state groups
            </h3>
            <span className="text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
              {groups.filter((group) => group.members.length > 1).length} merged group(s)
            </span>
          </div>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group, index) => (
              <div
                key={group.name}
                className="flex items-start gap-2 rounded-lg border border-[#C7D3C1]/70 px-2.5 py-1.5 dark:border-[#3a443a]"
              >
                <span
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                  style={{ backgroundColor: groupColor(index) }}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-semibold text-[#292D29] dark:text-slate-100">
                    {group.name}
                  </p>
                  <p className="flex flex-wrap items-center gap-1 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                    <span className="rounded bg-[#F2F5EF] px-1 dark:bg-[#263026]">
                      {groupBadge(index)}
                    </span>
                    {group.members.join(', ')}
                    {group.isInitial && <span className="chip chip-indigo !px-1 !py-0 !text-[8px]">initial</span>}
                    {group.isFinal && <span className="chip chip-emerald !px-1 !py-0 !text-[8px]">accepting</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[#c9a79b]/60 bg-[#f7ece7]/40 px-2.5 py-2 dark:border-[#7c4232]/30 dark:bg-[#7c4232]/8">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#7c4232] dark:text-[#e0b8a9]">
              Distinguishable pairs ({markedPairs})
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {analysis.pairs
                .filter((pair) => analysis.marked[pair.key])
                .map((pair) => {
                  const info = analysis.marked[pair.key]
                  return (
                    <span
                      key={pair.key}
                      className="rounded border border-[#c9a79b] bg-[#FAFAF7]/80 px-1.5 py-0.5 font-mono text-[10px] text-[#7c4232] dark:border-[#7c4232]/45 dark:bg-[#1b211c]/50 dark:text-[#e0b8a9]"
                      title={
                        info?.reason === 'finality'
                          ? 'Accepting status'
                          : `Round ${info?.round ?? '?'}`
                      }
                    >
                      {formatPair(pair)}{' '}
                      <span className="text-[8px] font-bold uppercase">
                        {info?.reason === 'finality' ? 'F' : `R${info?.round ?? '?'}`}
                      </span>
                    </span>
                  )
                })}
              {markedPairs === 0 && (
                <span className="text-[11px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  No pair is distinguishable — every reachable state is equivalent.
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#A8B5A0]/70 bg-[#e7ede3]/40 px-2.5 py-2 dark:border-[#A8B5A0]/25 dark:bg-[#A8B5A0]/8">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#3e4c3f] dark:text-[#C7D3C1]">
              Equivalent pairs ({analysis.equivalentPairs.length})
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {analysis.equivalentPairs.map((pair) => (
                <span
                  key={pair.key}
                  className="rounded border border-[#A8B5A0] bg-[#FAFAF7]/80 px-1.5 py-0.5 font-mono text-[10px] text-[#3e4c3f] dark:border-[#A8B5A0]/35 dark:bg-[#1b211c]/50 dark:text-[#C7D3C1]"
                >
                  {formatPair(pair)}
                </span>
              ))}
              {analysis.equivalentPairs.length === 0 && (
                <span className="text-[11px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  No equivalent pairs remain — every state is already distinct.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#C7D3C1]/70 bg-[#F2F5EF]/60 px-3 py-2 text-[11px] text-[#3a463b]/85 dark:border-[#3a443a] dark:bg-[#263026]/50 dark:text-slate-300">
          <span className="font-semibold">Verification:</span>
          <span>
            {analysis.build?.consistent
              ? 'Every class agrees on destination classes for all symbols.'
              : 'The quotient consistency check failed.'}
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
            {formatSet(analysis.orderedReachable)}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
            {formatSet(minimized.states)}
          </span>
        </div>
      </div>

      {/* Hidden on screen, visible in print / PDF. */}
      <div className="print-report" aria-hidden="true">
        <h1>AutomataLab — DFA minimization report</h1>
        <p className="muted">
          {sourceLabel} · Table-filling method · Generated {generatedAt}
        </p>

        <h2>Summary</h2>
        <table>
          <tbody>
            <tr>
              <th>Original states</th>
              <td>{dfa.states.length}</td>
              <th>Reachable states</th>
              <td>{analysis.orderedReachable.length}</td>
            </tr>
            <tr>
              <th>Unreachable removed</th>
              <td>{removed}</td>
              <th>State pairs examined</th>
              <td>{pairs}</td>
            </tr>
            <tr>
              <th>Distinguishable pairs</th>
              <td>{markedPairs}</td>
              <th>Equivalent pairs</th>
              <td>{analysis.equivalentPairs.length}</td>
            </tr>
            <tr>
              <th>Minimized states</th>
              <td>{minimized.states.length}</td>
              <th>Minimized accepting states</th>
              <td>{minimized.finalStates.length}</td>
            </tr>
            <tr>
              <th>Equivalence groups</th>
              <td>{groups.length}</td>
              <th>Marking rounds</th>
              <td>{markingRounds}</td>
            </tr>
            <tr>
              <th>Recorded steps</th>
              <td>{analysis.steps.length}</td>
              <th>Alphabet</th>
              <td>{formatSet(dfa.alphabet)}</td>
            </tr>
          </tbody>
        </table>

        <h2>Original DFA</h2>
        <div className="avoid-break" dangerouslySetInnerHTML={{ __html: originalSvg }} />
        <table>
          <thead>
            <tr>
              <th>State</th>
              {dfa.alphabet.map((symbol) => (
                <th key={symbol}>{symbol}</th>
              ))}
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {dfa.states.map((state) => (
              <tr key={state}>
                <th>{state}</th>
                {dfa.alphabet.map((symbol) => (
                  <td key={symbol}>{dfa.transitions[state]?.[symbol] ?? 'undefined'}</td>
                ))}
                <td>
                  {[
                    state === dfa.initialState ? 'initial' : '',
                    dfa.finalStates.includes(state) ? 'accepting' : '',
                    analysis.unreachable.includes(state) ? 'unreachable (removed)' : '',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'normal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Minimized DFA</h2>
        <div className="avoid-break" dangerouslySetInnerHTML={{ __html: minimizedSvg }} />
        <table>
          <thead>
            <tr>
              <th>Class</th>
              {minimized.alphabet.map((symbol) => (
                <th key={symbol}>{symbol}</th>
              ))}
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {minimized.states.map((state) => (
              <tr key={state}>
                <th>{state}</th>
                {minimized.alphabet.map((symbol) => (
                  <td key={symbol}>{minimized.transitions[state]?.[symbol] ?? ''}</td>
                ))}
                <td>
                  {[
                    state === minimized.initialState ? 'initial' : '',
                    minimized.finalStates.includes(state) ? 'accepting' : '',
                  ]
                    .filter(Boolean)
                    .join(', ') || 'normal'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Equivalence classes</h2>
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Members</th>
              <th>Initial</th>
              <th>Accepting</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.name}>
                <th>{group.name}</th>
                <td>{group.members.join(', ')}</td>
                <td>{group.isInitial ? 'yes' : 'no'}</td>
                <td>{group.isFinal ? 'yes' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Step-by-step summary</h2>
        <ol>
          {analysis.steps.map((step) => (
            <li key={step.index}>
              <strong>{step.title}.</strong> {step.result}
            </li>
          ))}
        </ol>

        <p className="muted">
          Generated by AutomataLab. The result was produced by the table-filling method and checked
          with a consistency check on the quotient automaton.
        </p>
      </div>
    </section>
  )
}
