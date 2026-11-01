import {
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  GitCompare,
  GraduationCap,
  Layers,
  Play,
  Route,
  Sparkles,
  TableProperties,
  Target,
  Workflow,
  Zap,
} from 'lucide-react'
import type { Page } from '../types/app'
import { analyzeDFA } from '../algorithms/analyze'
import { STARTER_DFA } from '../data/starter'
import { CHALLENGES } from '../data/challenges'
import { formatSet } from '../utils/automataHelpers'
import { MiniDFAGraph } from '../components/MiniDFAGraph'
import { cn } from '../utils/cn'

const STARTER = analyzeDFA(STARTER_DFA)

const FEATURES = [
  {
    icon: Route,
    title: 'See reachability first',
    body: 'A breadth-first traversal marks every state the initial state can actually enter. Unreachable states are faded and explicitly removed before any pair is generated.',
  },
  {
    icon: TableProperties,
    title: 'Watch every marking round',
    body: 'Each pair is checked symbol by symbol. Newly distinguishable pairs flash into the triangular matrix, and the fixed point continues until a full pass changes nothing.',
  },
  {
    icon: Layers,
    title: 'Build the quotient DFA',
    body: 'Unmarked pairs become equivalence classes. Each class becomes one state, transitions are wired class-to-class, and the minimized diagram and table appear together.',
  },
]

const METHOD = [
  {
    step: '01',
    title: 'Validate & prune',
    body: 'Check completeness, then keep only reachable states. Unreachable states are irrelevant to the language.',
  },
  {
    step: '02',
    title: 'Generate pairs',
    body: 'For n reachable states, build the n(n−1)/2 unordered pairs in a triangular table. No duplicates, no ghosts.',
  },
  {
    step: '03',
    title: 'Mark to a fixed point',
    body: 'Mark final/non-final pairs, then mark a pair whenever some symbol leads it into an already marked pair. Repeat until nothing changes.',
  },
  {
    step: '04',
    title: 'Merge & rebuild',
    body: 'The unmarked pairs are the Myhill–Nerode equivalence classes. The quotient automaton is the minimal DFA for the same language.',
  },
]

interface HomeProps {
  onNavigate: (page: Page) => void
  onOpenChallenge: (challengeId: string) => void
}

export function Home({ onNavigate, onOpenChallenge }: HomeProps) {
  return (
    <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:py-12">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Theory of Computation · ATC
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-4xl lg:text-[42px] dark:text-white">
            Learn DFA minimization
            <span className="block bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400">
              one table cell at a time.
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            AutomataLab is an interactive Table-Filling simulator. It does not just print the minimal
            DFA — it walks you through validation, reachability, pair generation, every marking
            round, equivalence classes and the final quotient construction.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => onNavigate('simulator')} className="btn btn-primary !px-4 !py-2.5 !text-xs">
              <Play className="h-4 w-4" aria-hidden="true" />
              Open the simulator
            </button>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn btn-secondary !px-4 !py-2.5 !text-xs"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Practice Arena
            </button>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CircleCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Real fixed-point algorithm
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              6 verified challenges
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Workflow className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Table + graph input
            </span>
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Starter example
              </p>
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                5 states → {STARTER.minimized?.states.length ?? '?'} minimal states
              </p>
            </div>
            <span className="chip chip-emerald">{(STARTER.groups ?? []).length} groups</span>
          </div>
          <div className="bg-slate-50/50 px-2 py-1 dark:bg-[#0a1322]">
            <MiniDFAGraph dfa={STARTER_DFA} className="h-[236px]" label="Starter DFA preview" />
          </div>
          <div className="border-t border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
            <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              A and B behave identically, and so do the accepting states C and D. The table finds
              those unmarked pairs and the minimized DFA keeps one of each.
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(STARTER.groups ?? []).map((group, index) => (
                <span
                  key={group.join(',')}
                  className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                >
                  G{index + 1} = [{group.join(', ')}]
                </span>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              Alphabet {formatSet(STARTER_DFA.alphabet)} · {STARTER.pairs.length} pairs ·{' '}
              {STARTER.steps.length} recorded steps
            </p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="eyebrow">Why this simulator</p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Built to explain, not just to compute
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Every operation is a recorded, replayable step
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="app-card card-pad">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="mt-2.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {feature.title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {feature.body}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="app-card card-pad">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              The table-filling method in four moves
            </h2>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {METHOD.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-900/40"
              >
                <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  {item.step}
                </span>
                <h3 className="mt-0.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="app-card card-pad">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Try a practice challenge
              </h2>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
              Six pre-verified DFAs, from one redundant twin to a multi-round pattern detector.
            </p>
            <div className="mt-2 space-y-1">
              {CHALLENGES.slice(0, 4).map((challenge) => (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => onOpenChallenge(challenge.id)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <span
                    className={cn(
                      'chip !px-1.5 !py-0 !text-[9px]',
                      challenge.difficulty === 'Easy'
                        ? 'chip-emerald'
                        : challenge.difficulty === 'Medium'
                          ? 'chip-amber'
                          : 'chip-rose',
                    )}
                  >
                    {challenge.difficulty}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    Q{challenge.number} · {challenge.title}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-400" aria-hidden="true" />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn btn-secondary btn-sm mt-2 w-full"
            >
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              See all six challenges
            </button>
          </div>

          <div className="app-card card-pad">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" aria-hidden="true" />
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Correctness first
              </h2>
            </div>
            <ul className="mt-1.5 space-y-1">
              {[
                'Fixed-point marking with multiple rounds',
                'Unreachable states removed explicitly',
                'Quotient consistency check on every class',
                'Witness search + language-equivalence tests',
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-6 text-white shadow-sm sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">
              Ready to see the table fill itself?
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-indigo-100">
              Open the simulator, press play, and watch each comparison become a mark. Then try the
              same DFA by hand.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="btn !bg-white !px-4 !py-2.5 !text-xs !text-indigo-700 hover:!bg-indigo-50"
            >
              Launch simulator
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn !border !border-white/40 !bg-white/10 !px-4 !py-2.5 !text-xs !text-white hover:!bg-white/20"
            >
              Practice Arena
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
