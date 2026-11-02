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
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:py-14">
        <div className="max-w-3xl">
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
            <span className="h-px w-8 bg-[#A8B5A0]" aria-hidden="true" />
            Practice Arena
          </p>
          <h1 className="mt-4 max-w-[18ch] font-serif text-[34px] font-semibold leading-[1.05] tracking-[-0.01em] text-[#292D29] sm:text-[46px] dark:text-[#F2F5EF]">
            Six DFAs, six different{' '}
            <span className="italic text-[#465447] dark:text-[#A8B5A0]">lessons.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#465447] dark:text-slate-300">
            Each challenge is a real, complete DFA over the binary alphabet. Work through it in the
            simulator and let the table-filling walkthrough explain every mark. Expected answers stay
            hidden until you ask for them.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <span className="chip chip-neutral">2 Easy</span>
            <span className="chip chip-neutral">2 Medium</span>
            <span className="chip chip-neutral">2 Hard</span>
            <span className="chip chip-indigo">Binary alphabet {'{0, 1}'}</span>
            <span className="chip chip-emerald">answers independently verified</span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CHALLENGES.map((challenge) => {
            const attempted = attemptedIds.includes(challenge.id)
            const revealed = revealedIds.includes(challenge.id)
            return (
              <article
                key={challenge.id}
                className="app-card flex flex-col overflow-hidden transition-colors hover:border-[#A8B5A0] dark:hover:border-[#A8B5A0]/45"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[#C7D3C1]/60 px-3.5 py-2.5 dark:border-[#333c34]">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                    Question {challenge.number}
                  </span>
                  <span className={cn('chip !py-0.5 !text-[10px]', difficultyChip(challenge.difficulty))}>
                    {challenge.difficulty}
                  </span>
                </div>

                <div className="border-b border-[#C7D3C1]/40 bg-[#F2F5EF]/60 px-2 py-1 dark:border-[#333c34] dark:bg-[#161c17]">
                  <MiniDFAGraph
                    dfa={challenge.dfa}
                    label={`DFA for challenge ${challenge.number}: ${challenge.title}`}
                    className="h-[148px]"
                  />
                </div>

                <div className="flex flex-1 flex-col px-3.5 py-3">
                  <h2 className="font-serif text-xl font-semibold leading-tight tracking-tight text-[#292D29] dark:text-[#F2F5EF]">
                    {challenge.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] font-medium text-[#3a463b]/85 dark:text-[#A8B5A0]">
                    {challenge.tagline}
                  </p>
                  <p className="mt-2 flex-1 text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
                    {challenge.objective}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                    <span className="rounded bg-[#F2F5EF] px-1.5 py-0.5 dark:bg-[#263026]">
                      {challenge.dfa.states.length} states
                    </span>
                    <span className="rounded bg-[#F2F5EF] px-1.5 py-0.5 dark:bg-[#263026]">
                      {challenge.dfa.finalStates.length} accepting
                    </span>
                    <span className="rounded bg-[#F2F5EF] px-1.5 py-0.5 font-mono dark:bg-[#263026]">
                      {'{0, 1}'}
                    </span>
                    {attempted && (
                      <span className="rounded border border-[#A8B5A0] bg-[#e7ede3] px-1.5 py-0.5 font-semibold text-[#3e4c3f] dark:border-[#A8B5A0]/35 dark:bg-[#A8B5A0]/12 dark:text-[#C7D3C1]">
                        attempted
                      </span>
                    )}
                    {revealed && (
                      <span className="rounded border border-[#d8c39b] bg-[#f6efdf] px-1.5 py-0.5 font-semibold text-[#765c2e] dark:border-[#8a6d38]/45 dark:bg-[#8a6d38]/12 dark:text-[#dcc295]">
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
    <div className="mx-auto max-w-[1240px] px-4 py-6 sm:px-6 lg:py-8">
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
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  Question {selected.number}
                </p>
                <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#292D29] sm:text-[28px] dark:text-[#F2F5EF]">
                  {selected.title}
                </h1>
                <p className="text-xs font-medium text-[#3a463b]/85 dark:text-[#A8B5A0]">
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

            <p className="mt-3 text-xs leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
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
              <p className="animate-step mt-3 rounded-lg border border-[#d8c39b] bg-[#f6efdf]/70 px-2.5 py-2 text-[11px] leading-relaxed text-[#765c2e] dark:border-[#8a6d38]/45 dark:bg-[#8a6d38]/12 dark:text-[#dcc295]">
                <span className="font-bold uppercase tracking-wide">Hint:</span> {selected.hint}
              </p>
            )}

            {confirmReveal && !revealed && (
              <div className="animate-step mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#c9a79b] bg-[#f7ece7]/80 px-2.5 py-2 text-[11px] text-[#7c4232] dark:border-[#7c4232]/50 dark:bg-[#7c4232]/15 dark:text-[#e0b8a9]">
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
              <span className="text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
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
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-[#A8B5A0] bg-[#e7ede3] text-[#3e4c3f] dark:border-[#A8B5A0]/40 dark:bg-[#A8B5A0]/15 dark:text-[#C7D3C1]">
                  <CircleCheck className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-serif text-xl font-semibold leading-tight text-[#292D29] dark:text-[#F2F5EF]">
                    Expected answer
                  </h2>
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
                <p className="text-[10px] font-bold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                  Equivalent-state groups ({groups.length})
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {groups.map((group, index) => (
                    <span
                      key={`${group.join('-')}-${index}`}
                      className="rounded-md border border-[#A8B5A0] bg-[#e7ede3]/70 px-2 py-1 font-mono text-[11px] font-semibold text-[#3e4c3f] dark:border-[#A8B5A0]/35 dark:bg-[#A8B5A0]/12 dark:text-[#C7D3C1]"
                    >
                      [{group.join(', ')}]
                    </span>
                  ))}
                </div>
              </div>

              {unreachable.length > 0 && (
                <p className="mt-2.5 rounded-lg border border-[#d8c39b] bg-[#f6efdf]/70 px-2.5 py-2 text-[11px] text-[#765c2e] dark:border-[#8a6d38]/45 dark:bg-[#8a6d38]/12 dark:text-[#dcc295]">
                  <span className="font-semibold">Removed before pairing:</span>{' '}
                  {unreachable.join(', ')} — unreachable from {selected.dfa.initialState}. They do not
                  appear in any group.
                </p>
              )}

              <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                    Minimized DFA
                  </p>
                  <DFAGraph dfa={analysis.minimized} height={280} />
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                    Minimized transition table
                  </p>
                  <TransitionTable dfa={analysis.minimized} compact />
                </div>
              </div>
            </section>
          )}

          {!revealed && (
            <section className="app-card flex items-center gap-3 border-dashed px-4 py-3">
              <Eye className="h-4 w-4 shrink-0 text-[#3a463b]/75 dark:text-[#C7D3C1]/70" aria-hidden="true" />
              <p className="text-[11px] leading-relaxed text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                The expected minimized state count and equivalence groups stay hidden until you start
                the challenge or explicitly reveal the solution.
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-3">
          <section className="app-card card-pad">
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
              <Target className="h-3.5 w-3.5 text-[#465447] dark:text-[#A8B5A0]" aria-hidden="true" />
              Learning objective
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
              {selected.objective}
            </p>
          </section>

          <section className="app-card card-pad">
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
              <GraduationCap className="h-3.5 w-3.5 text-[#465447] dark:text-[#A8B5A0]" aria-hidden="true" />
              Challenge facts
            </h2>
            <dl className="mt-2 divide-y divide-[#C7D3C1]/50 text-[11px] dark:divide-[#333c34]">
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
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
              <Sparkles className="h-3.5 w-3.5 text-[#465447] dark:text-[#A8B5A0]" aria-hidden="true" />
              How to use this challenge
            </h2>
            <ol className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
              <li className="flex gap-1.5">
                <span className="font-mono text-[#8a6d38] dark:text-[#dcc295]">1.</span>
                Open “Solve step by step” to load the DFA into the simulator.
              </li>
              <li className="flex gap-1.5">
                <span className="font-mono text-[#8a6d38] dark:text-[#dcc295]">2.</span>
                Step through reachability, pair generation and every marking round.
              </li>
              <li className="flex gap-1.5">
                <span className="font-mono text-[#8a6d38] dark:text-[#dcc295]">3.</span>
                Compare your fixed point with the reveal above.
              </li>
            </ol>
            <button
              type="button"
              onClick={() => {
                onAttempt(selected.id)
                onSolve(selected)
              }}
              className="btn btn-primary btn-sm mt-3 w-full"
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
    <div className="rounded-lg border border-[#C7D3C1]/70 bg-[#F2F5EF]/60 px-2 py-1.5 dark:border-[#3a443a] dark:bg-[#263026]/50">
      <p className="text-[9px] font-bold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
        {label}
      </p>
      <p
        className={cn(
          'mt-0.5 truncate text-[11px] font-semibold text-[#292D29] dark:text-slate-100',
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
    <div className="flex items-center justify-between gap-2 py-1">
      <dt className="text-[#3a463b]/75 dark:text-[#C7D3C1]/70">{label}</dt>
      <dd className="truncate font-mono font-semibold text-[#292D29] dark:text-slate-100" title={value}>
        {value}
      </dd>
    </div>
  )
}
