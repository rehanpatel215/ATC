import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Eye,
  GraduationCap,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'
import type { Challenge } from '../data/challenges'
import { CHALLENGES } from '../data/challenges'
import { analyzeDFA } from '../algorithms/analyze'
import { formatSet } from '../utils/automataHelpers'
import { cn } from '../utils/cn'
import { DFAGraph } from './DFAGraph'
import { MiniDFAGraph } from './MiniDFAGraph'
import { TransitionTable } from './TransitionTable'

interface PracticeArenaProps {
  onSolve: (challenge: Challenge) => void
  attemptedIds: string[]
  revealedIds: string[]
  onAttempt: (id: string) => void
  onReveal: (id: string) => void
  onResetProgress: (id: string) => void
  /** Controlled selection so the chosen challenge survives page navigation. */
  selectedId: string | null
  onSelect: (id: string | null) => void
}

function difficultyChip(difficulty: Challenge['difficulty']): string {
  if (difficulty === 'Easy') return 'chip-emerald'
  if (difficulty === 'Medium') return 'chip-amber'
  return 'chip-rose'
}

/**
 * Practice Arena: six independent, pre-verified DFAs. Expected answers are
 * only rendered after an explicit reveal (or after the user has started the
 * challenge in the simulator).
 */
export function PracticeArena({
  onSolve,
  attemptedIds,
  revealedIds,
  onAttempt,
  onReveal,
  onResetProgress,
  selectedId,
  onSelect,
}: PracticeArenaProps) {
  const [confirmReveal, setConfirmReveal] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const selected = selectedId
    ? (CHALLENGES.find((challenge) => challenge.id === selectedId) ?? null)
    : null
  const analysis = useMemo(() => (selected ? analyzeDFA(selected.dfa) : null), [selected])

  if (!selected) {
    return (
      <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
        <div className="max-w-3xl">
          <p className="eyebrow">Practice Arena</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Six DFAs, six different minimization lessons
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Each challenge is a real, complete DFA over the binary alphabet. Work through it in the
            simulator and let the table-filling walkthrough explain every mark. Expected answers stay
            hidden until you ask for them.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip chip-neutral">2 Easy</span>
            <span className="chip chip-neutral">2 Medium</span>
            <span className="chip chip-neutral">2 Hard</span>
            <span className="chip chip-indigo">Binary alphabet {'{0, 1}'}</span>
            <span className="chip chip-emerald">answers independently verified</span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CHALLENGES.map((challenge) => {
            const attempted = attemptedIds.includes(challenge.id)
            const revealed = revealedIds.includes(challenge.id)
            return (
              <article
                key={challenge.id}
                className="app-card flex flex-col overflow-hidden transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                    Question {challenge.number}
                  </span>
                  <span className={cn('chip !py-0.5 !text-[10px]', difficultyChip(challenge.difficulty))}>
                    {challenge.difficulty}
                  </span>
                </div>

                <div className="bg-slate-50/60 px-2 py-1 dark:bg-[#0a1322]">
                  <MiniDFAGraph
                    dfa={challenge.dfa}
                    label={`DFA for challenge ${challenge.number}: ${challenge.title}`}
                    className="h-[148px]"
                  />
                </div>

                <div className="flex flex-1 flex-col px-3 py-2.5">
                  <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                    {challenge.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                    {challenge.tagline}
                  </p>
                  <p className="mt-1.5 flex-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {challenge.objective}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                      {challenge.dfa.states.length} states
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                      {challenge.dfa.finalStates.length} accepting
                    </span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono dark:bg-slate-800">
                      {'{0, 1}'}
                    </span>
                    {attempted && (
                      <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
                        attempted
                      </span>
                    )}
                    {revealed && (
                      <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                        solution revealed
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(challenge.id)
                        setConfirmReveal(false)
                        setShowHint(false)
                      }}
                      className="btn btn-secondary btn-sm flex-1"
                    >
                      View challenge
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onAttempt(challenge.id)
                        onSolve(challenge)
                      }}
                      className="btn btn-primary btn-sm flex-1"
                    >
                      <Play className="h-3 w-3" aria-hidden="true" />
                      Solve
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  const attempted = attemptedIds.includes(selected.id)
  const revealed = revealedIds.includes(selected.id)
  const reachable = analysis?.orderedReachable ?? []
  const unreachable = analysis?.unreachable ?? []
  const minimizedCount = analysis?.minimized?.states.length ?? selected.expected.minimizedStates
  const groups = analysis?.groups ?? selected.expected.groups

  return (
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6">
      <button
        type="button"
        onClick={() => {
          onSelect(null)
          setConfirmReveal(false)
          setShowHint(false)
        }}
        className="btn btn-ghost btn-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        All challenges
      </button>

      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="app-card card-pad">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                  Question {selected.number}
                </p>
                <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                  {selected.title}
                </h1>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  {selected.tagline}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={cn('chip !py-0.5 !text-[10px]', difficultyChip(selected.difficulty))}>
                  {selected.difficulty}
                </span>
                {attempted && <span className="chip chip-indigo">attempted</span>}
              </div>
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {selected.description}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <MetaTile label="States" value={selected.dfa.states.length} />
              <MetaTile label="Alphabet" value={`{${selected.dfa.alphabet.join(', ')}}`} mono />
              <MetaTile label="Initial" value={selected.dfa.initialState} mono />
              <MetaTile
                label="Accepting"
                value={formatSet(selected.dfa.finalStates)}
                mono
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onAttempt(selected.id)
                  onSolve(selected)
                }}
                className="btn btn-primary btn-sm"
              >
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Solve step by step
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetProgress(selected.id)
                  setConfirmReveal(false)
                  setShowHint(false)
                }}
                className="btn btn-secondary btn-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Reset challenge
              </button>
              <button
                type="button"
                onClick={() => setShowHint((current) => !current)}
                aria-expanded={showHint}
                className="btn btn-ghost btn-sm"
              >
                <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                {showHint ? 'Hide hint' : 'Show hint'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (revealed) return
                  if (attempted) {
                    onReveal(selected.id)
                    return
                  }
                  setConfirmReveal(true)
                }}
                disabled={revealed}
                className="btn btn-success btn-sm ml-auto"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                {revealed ? 'Solution revealed' : 'Show solution'}
              </button>
            </div>

            {showHint && (
              <p className="animate-step mt-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <span className="font-bold uppercase tracking-wide">Hint:</span> {selected.hint}
              </p>
            )}

            {confirmReveal && !revealed && (
              <div className="animate-step mt-2.5 flex flex-wrap items-center gap-2 rounded-lg border border-rose-200 bg-rose-50/80 px-2.5 py-2 text-[11px] text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">
                  You have not started this challenge yet. Revealing now shows the expected minimized
                  state count and groups immediately.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onReveal(selected.id)
                    setConfirmReveal(false)
                  }}
                  className="btn btn-danger btn-sm"
                >
                  Reveal answer
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReveal(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Keep practising
                </button>
              </div>
            )}
          </section>

          <section className="app-card card-pad">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="card-title">Challenge DFA</h2>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                drag nodes · scroll to pan · zoom with the controls
              </span>
            </div>
            <DFAGraph dfa={selected.dfa} height={360} />
          </section>

          <section className="app-card card-pad">
            <h2 className="card-title mb-2">Complete transition table</h2>
            <TransitionTable dfa={selected.dfa} />
          </section>

          {revealed && analysis?.minimized && (
            <section className="app-card card-pad animate-step">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <CircleCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="card-title">Expected answer</h2>
                  <p className="card-subtitle">
                    Computed from the challenge DFA and cross-checked against an independent
                    partition-refinement implementation.
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <MetaTile label="Minimized states" value={minimizedCount} />
                <MetaTile label="Reachable" value={reachable.length} />
                <MetaTile label="Unreachable" value={unreachable.length} />
                <MetaTile label="Accepting" value={analysis.minimized.finalStates.length} />
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Equivalent-state groups ({groups.length})
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {groups.map((group, index) => (
                    <span
                      key={`${group.join('-')}-${index}`}
                      className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                    >
                      [{group.join(', ')}]
                    </span>
                  ))}
                </div>
              </div>

              {unreachable.length > 0 && (
                <p className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50/70 px-2.5 py-2 text-[11px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  <span className="font-semibold">Removed before pairing:</span>{' '}
                  {unreachable.join(', ')} — unreachable from {selected.dfa.initialState}. They do not
                  appear in any group.
                </p>
              )}

              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Minimized DFA
                  </p>
                  <DFAGraph dfa={analysis.minimized} height={280} />
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Minimized transition table
                  </p>
                  <TransitionTable dfa={analysis.minimized} compact />
                </div>
              </div>
            </section>
          )}

          {!revealed && (
            <section className="app-card flex items-center gap-3 border-dashed px-4 py-3">
              <Eye className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                The expected minimized state count and equivalence groups stay hidden until you start
                the challenge or explicitly reveal the solution.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-3">
          <section className="app-card card-pad">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Target className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              Learning objective
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {selected.objective}
            </p>
          </section>

          <section className="app-card card-pad">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <GraduationCap className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              Challenge facts
            </h2>
            <dl className="mt-2 space-y-1.5 text-[11px]">
              <Fact label="Difficulty" value={selected.difficulty} />
              <Fact label="States" value={`${selected.dfa.states.length}`} />
              <Fact label="Alphabet" value={formatSet(selected.dfa.alphabet)} />
              <Fact label="Initial state" value={selected.dfa.initialState} />
              <Fact label="Accepting" value={formatSet(selected.dfa.finalStates)} />
              <Fact label="Attempt status" value={attempted ? 'Attempted' : 'Not attempted'} />
              <Fact label="Solution" value={revealed ? 'Revealed' : 'Hidden'} />
            </dl>
          </section>

          <section className="app-card card-pad">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              How to use this challenge
            </h2>
            <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              <li className="flex gap-1.5">
                <span className="font-mono text-indigo-600 dark:text-indigo-400">1.</span>
                Open “Solve step by step” to load the DFA into the simulator.
              </li>
              <li className="flex gap-1.5">
                <span className="font-mono text-indigo-600 dark:text-indigo-400">2.</span>
                Step through reachability, pair generation and every marking round.
              </li>
              <li className="flex gap-1.5">
                <span className="font-mono text-indigo-600 dark:text-indigo-400">3.</span>
                Compare your fixed point with the reveal above.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => {
                onAttempt(selected.id)
                onSolve(selected)
              }}
              className="btn btn-primary btn-sm mt-2.5 w-full"
            >
              Solve step by step
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}

function MetaTile({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-[11px] font-semibold text-slate-800 dark:text-slate-100',
          mono && 'font-mono',
        )}
        title={String(value)}
      >
        {value}
      </p>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="truncate font-mono font-semibold text-slate-800 dark:text-slate-100" title={value}>
        {value}
      </dd>
    </div>
  )
}
