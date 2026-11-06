import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CircleCheck,
  Eye,
  Layers,
  Play,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react'
import type { DFA, PairKey, PairRecord } from '../types/automata'
import type { DFASource, Page } from '../types/app'
import type { Challenge } from '../data/challenges'
import { useSimulation } from '../hooks/useSimulation'
import { transitionRefsForPair, uniqueRefs } from '../utils/automataHelpers'
import { groupBadge, groupColor } from '../utils/colors'
import { cn } from '../utils/cn'
import { DFAInput } from '../components/DFAInput'
import { DFAGraph } from '../components/DFAGraph'
import { ExplanationPanel } from '../components/ExplanationPanel'
import { PairTable } from '../components/PairTable'
import { ResultSummary } from '../components/ResultSummary'
import { StepControls } from '../components/StepControls'
import { TransitionTable } from '../components/TransitionTable'

interface SimulatorProps {
  dfa: DFA
  source: DFASource
  challenge?: Challenge
  revealed: boolean
  onReveal: () => void
  onResetChallenge: () => void
  onResetDFA: () => void
  onLoadStarter: () => void
  onLoadExample: () => void
  onChangeDFA: (dfa: DFA) => void
  onNavigate: (page: Page) => void
}

function sourceDetails(source: DFASource, challenge?: Challenge) {
  if (source.kind === 'challenge' && challenge) {
    return {
      label: `Practice Q${challenge.number} · ${challenge.title}`,
      reset: 'Reset challenge',
    }
  }
  if (source.kind === 'starter') return { label: 'Starter example', reset: 'Reset starter' }
  if (source.kind === 'example') return { label: 'Specification example', reset: 'Reset example' }
  return { label: 'Your own DFA', reset: 'Clear input' }
}

/**
 * The main workspace. Layout follows the specification: input on the left,
 * graphs in the centre, the explanation on the right, and the pair matrix with
 * playback controls along the bottom.
 */
export function Simulator({
  dfa,
  source,
  challenge,
  revealed,
  onReveal,
  onResetChallenge,
  onResetDFA,
  onLoadStarter,
  onLoadExample,
  onChangeDFA,
  onNavigate,
}: SimulatorProps) {
  const sim = useSimulation(dfa)
  const { analysis, currentStep: step } = sim
  const [selectedKey, setSelectedKey] = useState<PairKey | null>(null)
  const [lastAnalysis, setLastAnalysis] = useState(analysis)
  const autoStartedRef = useRef<DFA | null>(null)

  // A new DFA invalidates the selected pair; clear it in the same render pass.
  if (lastAnalysis !== analysis) {
    setLastAnalysis(analysis)
    setSelectedKey(null)
  }

  const start = sim.start
  useEffect(() => {
    if (source.kind !== 'challenge' || !source.autoStart) return
    if (autoStartedRef.current === dfa) return
    autoStartedRef.current = dfa
    start()
  }, [source, dfa, start])

  const selectedPair: PairRecord | null = useMemo(() => {
    if (!selectedKey) return null
    return analysis.pairs.find((pair) => pair.key === selectedKey) ?? null
  }, [selectedKey, analysis.pairs])

  const focusStates = useMemo(() => {
    const set = new Set(step?.focusStates ?? [])
    if (selectedPair) {
      set.add(selectedPair.a)
      set.add(selectedPair.b)
    }
    return [...set]
  }, [step?.focusStates, selectedPair])

  const activeTransitions = useMemo(() => {
    const refs = step?.activeTransitions ? [...step.activeTransitions] : []
    if (selectedPair) refs.push(...transitionRefsForPair(dfa, selectedPair))
    return uniqueRefs(refs)
  }, [step, selectedPair, dfa])

  const finalized = Boolean(
    step &&
      (step.phase === 'equivalence' ||
        step.phase === 'build' ||
        step.phase === 'done' ||
        (step.kind === 'round-end' && step.newlyMarked.length === 0)),
  )

  const details = sourceDetails(source, challenge)
  const groups = analysis.build?.groups ?? []
  const done = step?.kind === 'done' && analysis.valid && analysis.minimized !== null

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6">
      {challenge && source.kind === 'challenge' && (
        <section className="app-card mb-3 overflow-hidden border-l-2 border-l-[#A8B5A0]">
          <div className="flex flex-wrap items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="chip chip-emerald !py-0.5 !text-[10px]">
                  Practice · Question {challenge.number}
                </span>
                <span
                  className={cn(
                    'chip !py-0.5 !text-[10px]',
                    challenge.difficulty === 'Easy'
                      ? 'chip-emerald'
                      : challenge.difficulty === 'Medium'
                        ? 'chip-amber'
                        : 'chip-rose',
                  )}
                >
                  {challenge.difficulty}
                </span>
                <span className="chip chip-neutral !py-0.5 !text-[10px]">
                  {challenge.dfa.states.length} states · alphabet {'{0, 1}'}
                </span>
              </div>
              <h1 className="mt-1 font-serif text-lg font-semibold tracking-tight text-[#292D29] dark:text-[#F2F5EF]">
                {challenge.title}
              </h1>
              <p className="mt-0.5 max-w-3xl text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
                {challenge.objective}
              </p>
              {revealed ? (
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#3e4c3f] dark:text-[#C7D3C1]">
                    Expected:
                  </span>
                  <span className="rounded border border-[#A8B5A0] bg-[#e7ede3] px-1.5 py-0.5 text-[10px] font-semibold text-[#3e4c3f] dark:border-[#A8B5A0]/40 dark:bg-[#A8B5A0]/15 dark:text-[#C7D3C1]">
                    {analysis.minimized?.states.length ?? challenge.expected.minimizedStates}{' '}
                    minimized states
                  </span>
                  {groups.map((group) => (
                    <span
                      key={group.name}
                      className="rounded border border-[#A8B5A0] bg-[#FAFAF7]/70 px-1.5 py-0.5 font-mono text-[10px] text-[#3e4c3f] dark:border-[#A8B5A0]/35 dark:bg-[#1b211c]/50 dark:text-[#C7D3C1]"
                    >
                      [{group.members.join(', ')}]
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded border border-dashed border-[#A8B5A0] px-2 py-1 text-[10px] text-[#3a463b]/75 dark:border-[#465447] dark:text-[#C7D3C1]/70">
                  <Eye className="h-3 w-3" aria-hidden="true" />
                  Expected answer hidden — reveal it whenever you want to compare.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={onResetChallenge} className="btn btn-secondary btn-sm">
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                Reset challenge
              </button>
              <button
                type="button"
                onClick={onReveal}
                disabled={revealed}
                className="btn btn-success btn-sm"
              >
                <Eye className="h-3 w-3" aria-hidden="true" />
                {revealed ? 'Answer revealed' : 'Show expected answer'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('practice')}
                className="btn btn-ghost btn-sm"
              >
                <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                Practice Arena
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Execution controls at the top */}
      <div className="mb-3">
        <StepControls sim={sim} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <DFAInput
            dfa={dfa}
            onChange={onChangeDFA}
            onReset={source.kind === 'challenge' ? onResetChallenge : onResetDFA}
            onLoadStarter={onLoadStarter}
            onLoadExample={onLoadExample}
            sourceLabel={details.label}
            resetLabel={details.reset}
          />
        </div>

        <div className="min-w-0 space-y-3">
          <section className="app-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C7D3C1]/60 px-4 py-2.5 dark:border-[#333c34]">
              <div className="flex items-center gap-2">
                <h2 className="card-title">Original DFA</h2>
                <span className="chip chip-neutral !py-0.5 !text-[10px]">
                  {analysis.orderedReachable.length} reachable
                </span>
                {analysis.unreachable.length > 0 && (
                  <span className="chip chip-amber !py-0.5 !text-[10px]">
                    {analysis.unreachable.length} unreachable
                  </span>
                )}
                {analysis.valid && (
                  <span className="hidden text-[10px] text-[#3a463b]/75 sm:inline dark:text-[#C7D3C1]/70">
                    {analysis.pairs.length} pairs
                    {analysis.markingRounds > 0 ? ` · ${analysis.markingRounds} rounds` : ''}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  <span className="h-2 w-2 rounded-full bg-[#b08a52]" aria-hidden="true" />
                  focus
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  <span className="h-2 w-2 rounded-full bg-[#465447] dark:bg-[#A8B5A0]" aria-hidden="true" />
                  active transition
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  <span className="h-2 w-2 rounded-full bg-[#C7D3C1] dark:bg-[#3a443a]" aria-hidden="true" />
                  faded
                </span>
              </div>
            </div>

            {!analysis.valid && (
              <div className="mx-3 mt-3 flex items-start gap-2 rounded-lg border border-[#c9a79b] bg-[#f7ece7]/80 px-2.5 py-2 text-[11px] text-[#7c4232] dark:border-[#7c4232]/50 dark:bg-[#7c4232]/15 dark:text-[#e0b8a9]">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  The input is not a complete DFA yet, so the walkthrough is paused. Fix the{' '}
                  {analysis.validation.errors.length} validation error
                  {analysis.validation.errors.length === 1 ? '' : 's'} in the input panel — the graph
                  below shows the current (possibly incomplete) shape.
                </span>
              </div>
            )}

            <div className="p-2.5">
              <DFAGraph
                dfa={dfa}
                height={350}
                focusStates={focusStates}
                activeTransitions={activeTransitions}
                fadedStates={step?.fadeUnreachable ? analysis.unreachable : []}
                showReachability={step?.showReachability}
                visited={step?.visited}
                groups={step?.groups}
                showGroups={step?.showGroups}
                onStateClick={
                  analysis.valid
                    ? (state) => {
                        const other = analysis.pairs.find(
                          (pair) =>
                            pair.key === selectedKey && (pair.a === state || pair.b === state),
                        )
                        if (other) {
                          setSelectedKey(null)
                          return
                        }
                        const candidate = analysis.pairs.find(
                          (pair) => pair.a === state || pair.b === state,
                        )
                        if (candidate) setSelectedKey(candidate.key)
                      }
                    : undefined
                }
              />
            </div>

            {analysis.valid && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#C7D3C1]/60 px-4 py-2 text-[10px] text-[#3a463b]/75 dark:border-[#333c34] dark:text-[#C7D3C1]/70">
                <span>
                  Reachable: <span className="font-mono font-semibold">{analysis.orderedReachable.join(', ')}</span>
                </span>
                {analysis.unreachable.length > 0 && (
                  <span className="text-[#765c2e] dark:text-[#dcc295]">
                    Removed: <span className="font-mono font-semibold line-through">{analysis.unreachable.join(', ')}</span>
                  </span>
                )}
                <span className="ml-auto">Click a state to inspect one of its pairs.</span>
              </div>
            )}
          </section>

          {step?.showGroups && groups.length > 0 && (
            <section className="app-card card-pad animate-step">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="card-title flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#465447] dark:text-[#A8B5A0]" aria-hidden="true" />
                  Equivalence classes
                </h2>
                <span className="text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  {groups.length} class{groups.length === 1 ? '' : 'es'} from {analysis.equivalentPairs.length}{' '}
                  equivalent pair{analysis.equivalentPairs.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {groups.map((group, index) => (
                  <div
                    key={group.name}
                    className="flex items-center gap-2 rounded-lg border border-[#C7D3C1]/70 px-2 py-1.5 dark:border-[#3a443a]"
                  >
                    <span
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
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
                        {group.isInitial && (
                          <span className="chip chip-indigo !px-1 !py-0 !text-[8px]">initial</span>
                        )}
                        {group.isFinal && (
                          <span className="chip chip-emerald !px-1 !py-0 !text-[8px]">accepting</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {step?.showMinimized && analysis.minimized && (
            <section className="app-card overflow-hidden animate-step">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#C7D3C1]/60 px-4 py-2.5 dark:border-[#333c34]">
                <div className="flex items-center gap-2">
                  <h2 className="card-title">Minimized DFA</h2>
                  <span className="chip chip-emerald !py-0.5 !text-[10px]">
                    {analysis.minimized.states.length} states
                  </span>
                  <span className="chip chip-neutral !py-0.5 !text-[10px]">
                    {analysis.minimized.finalStates.length} accepting
                  </span>
                </div>
                <span className="font-mono text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  initial: {analysis.minimized.initialState}
                </span>
              </div>
              <div className="p-2.5">
                <DFAGraph dfa={analysis.minimized} height={300} />
              </div>
              <div className="px-2.5 pb-2.5">
                <TransitionTable dfa={analysis.minimized} compact title="Minimized transition table" />
              </div>
            </section>
          )}

          {done && (
            <div className="flex items-center gap-2 rounded-lg border border-[#A8B5A0] bg-[#e7ede3]/70 px-3 py-2 text-[11px] text-[#3e4c3f] dark:border-[#A8B5A0]/35 dark:bg-[#A8B5A0]/12 dark:text-[#C7D3C1]">
              <CircleCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">
                Walkthrough complete. The result summary below contains the graphs, tables, groups and
                export buttons.
              </span>
              <button
                type="button"
                onClick={() =>
                  document.getElementById('result-summary')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
                className="btn btn-success btn-sm"
              >
                Jump to summary
              </button>
            </div>
          )}
        </div>

        <div className="min-w-0 xl:sticky xl:top-[76px] xl:self-start">
          <ExplanationPanel
            step={step}
            index={sim.index}
            total={sim.total}
            lastIndex={sim.lastIndex}
          />
        </div>
      </div>

      <div className="mt-3">
        <PairTable
          analysis={analysis}
          dfa={dfa}
          visible={analysis.valid && Boolean(step?.showPairs)}
          markedSoFar={step?.markedSoFar ?? []}
          finalized={finalized}
          newlyMarked={step?.newlyMarked}
          currentPair={step?.pair}
          selectedKey={selectedKey}
          onSelect={(pair) =>
            setSelectedKey((current) => (pair && current === pair.key ? null : (pair?.key ?? null)))
          }
        />
      </div>

      {done && analysis.minimized && (
        <div className="mt-3">
          <ResultSummary
            analysis={analysis}
            dfa={dfa}
            sourceLabel={details.label}
            title={
              challenge
                ? `Q${challenge.number} · ${challenge.title}: original → minimized`
                : 'Original DFA → minimized DFA'
            }
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
        <span className="inline-flex items-center gap-1">
          <Play className="h-3 w-3" aria-hidden="true" />
          Manual stepping and autoplay read the same {sim.total} recorded steps.
        </span>
        <span>{details.label}</span>
      </div>
    </div>
  )
}
