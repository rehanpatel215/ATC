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
    <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-6 lg:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <div>
          <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
            <span className="h-px w-8 bg-[#A8B5A0]" aria-hidden="true" />
            Theory of Computation · ATC
          </p>
          <h1 className="mt-5 max-w-[13ch] font-serif text-[42px] font-semibold leading-[1.02] tracking-[-0.01em] text-[#292D29] sm:text-[54px] lg:text-[62px] dark:text-[#F2F5EF]">
            Learn DFA minimization
            <span className="mt-1 block italic text-[#465447] dark:text-[#A8B5A0]">
              one table cell at a time.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#465447] dark:text-slate-300">
            AutomataLab is an interactive Table-Filling simulator. It does not just print the minimal
            DFA — it walks you through validation, reachability, pair generation, every marking
            round, equivalence classes and the final quotient construction.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="btn !px-5 !py-2.5 !text-xs"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Open the simulator
            </button>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn btn-secondary !px-5 !py-2.5 !text-xs"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Practice Arena
            </button>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2.5 border-t border-[#C7D3C1]/70 pt-4 text-[11px] font-medium text-[#3a463b]/85 dark:border-[#333c34] dark:text-[#C7D3C1]/70">
            <span className="inline-flex items-center gap-1.5">
              <CircleCheck className="h-3.5 w-3.5 text-[#6e7f63] dark:text-[#A8B5A0]" aria-hidden="true" />
              Real fixed-point algorithm
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#6e7f63] dark:text-[#A8B5A0]" aria-hidden="true" />
              6 verified challenges
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Workflow className="h-3.5 w-3.5 text-[#6e7f63] dark:text-[#A8B5A0]" aria-hidden="true" />
              Table + graph input
            </span>
          </div>
        </div>

        <div className="app-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[#C7D3C1]/60 px-4 py-3 dark:border-[#333c34]">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                Starter example
              </p>
              <p className="mt-0.5 font-serif text-lg font-semibold leading-tight text-[#292D29] dark:text-[#F2F5EF]">
                5 states → {STARTER.minimized?.states.length ?? '?'} minimal states
              </p>
            </div>
            <span className="chip chip-emerald">{(STARTER.groups ?? []).length} groups</span>
          </div>
          <div className="border-b border-[#C7D3C1]/40 bg-[#F2F5EF]/70 px-2 py-1 dark:border-[#333c34] dark:bg-[#161c17]">
            <MiniDFAGraph dfa={STARTER_DFA} className="h-[236px]" label="Starter DFA preview" />
          </div>
          <div className="px-4 py-3">
            <p className="text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
              A and B behave identically, and so do the accepting states C and D. The table finds
              those unmarked pairs and the minimized DFA keeps one of each.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(STARTER.groups ?? []).map((group, index) => (
                <span
                  key={group.join(',')}
                  className="rounded border border-[#A8B5A0]/70 bg-[#F2F5EF] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#3e4c3f] dark:border-[#A8B5A0]/25 dark:bg-[#A8B5A0]/10 dark:text-[#C7D3C1]"
                >
                  G{index + 1} = [{group.join(', ')}]
                </span>
              ))}
            </div>
            <p className="mt-2.5 border-t border-[#C7D3C1]/50 pt-2 text-[10px] text-[#3a463b]/75 dark:border-[#333c34] dark:text-[#C7D3C1]/70">
              Alphabet {formatSet(STARTER_DFA.alphabet)} · {STARTER.pairs.length} pairs ·{' '}
              {STARTER.steps.length} recorded steps
            </p>
          </div>
        </div>
      </div>

      <section className="mt-16 border-t border-[#C7D3C1]/70 pt-9 dark:border-[#333c34]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Why this simulator</p>
            <h2 className="mt-1.5 font-serif text-3xl font-semibold tracking-tight text-[#292D29] sm:text-[34px] dark:text-[#F2F5EF]">
              Built to explain, not just to compute
            </h2>
          </div>
          <span className="max-w-xs text-[11px] leading-relaxed text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
            Every operation is a recorded, replayable step
          </span>
        </div>
        <div className="mt-7 grid gap-6 md:grid-cols-3 md:divide-x md:divide-[#C7D3C1]/70">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="md:px-7 md:first:pl-0 md:last:pr-0">
                <Icon className="h-5 w-5 text-[#465447] dark:text-[#A8B5A0]" aria-hidden="true" />
                <h3 className="mt-3 font-serif text-xl font-semibold text-[#292D29] dark:text-[#F2F5EF]">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
                  {feature.body}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mt-16 grid gap-10 border-t border-[#C7D3C1]/70 pt-9 lg:grid-cols-[minmax(0,1fr)_360px] dark:border-[#333c34]">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-[#465447] dark:text-[#A8B5A0]" aria-hidden="true" />
            <p className="eyebrow">Method</p>
          </div>
          <h2 className="mt-1.5 max-w-xl font-serif text-3xl font-semibold tracking-tight text-[#292D29] sm:text-[34px] dark:text-[#F2F5EF]">
            The table-filling method in four moves
          </h2>
          <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {METHOD.map((item) => (
              <div
                key={item.step}
                className="border-t border-[#C7D3C1] pt-3 dark:border-[#3a443a]"
              >
                <span className="font-mono text-[10px] font-semibold tracking-wide text-[#8a6d38] dark:text-[#dcc295]">
                  {item.step}
                </span>
                <h3 className="mt-1 font-serif text-lg font-semibold text-[#292D29] dark:text-[#F2F5EF]">
                  {item.title}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-7 lg:border-l lg:border-[#C7D3C1]/70 lg:pl-9 dark:lg:border-[#333c34]">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-[#8a6d38] dark:text-[#dcc295]" aria-hidden="true" />
              <h2 className="font-serif text-xl font-semibold text-[#292D29] dark:text-[#F2F5EF]">
                Try a practice challenge
              </h2>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300">
              Six pre-verified DFAs, from one redundant twin to a multi-round pattern detector.
            </p>
            <div className="mt-3 divide-y divide-[#C7D3C1]/60 border-y border-[#C7D3C1]/60 dark:divide-[#333c34] dark:border-[#333c34]">
              {CHALLENGES.slice(0, 4).map((challenge) => (
                <button
                  key={challenge.id}
                  type="button"
                  onClick={() => onOpenChallenge(challenge.id)}
                  className="group flex w-full items-center gap-2.5 py-2 text-left transition-colors hover:bg-[#F2F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465447] dark:hover:bg-[#202720] dark:focus-visible:ring-[#A8B5A0]"
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
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#292D29]/90 dark:text-slate-200">
                    Q{challenge.number} · {challenge.title}
                  </span>
                  <ArrowRight
                    className="h-3 w-3 shrink-0 text-[#3a463b]/75 transition-transform group-hover:translate-x-0.5 dark:text-[#C7D3C1]/70"
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn btn-secondary btn-sm mt-3 w-full"
            >
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              See all six challenges
            </button>
          </div>

          <div className="border-t border-[#C7D3C1]/70 pt-5 dark:border-[#333c34]">
            <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-[#292D29] dark:text-[#F2F5EF]">
              <Zap className="h-4 w-4 text-[#8a6d38] dark:text-[#dcc295]" aria-hidden="true" />
              Correctness first
            </h2>
            <ul className="mt-2.5 space-y-1.5">
              {[
                'Fixed-point marking with multiple rounds',
                'Unreachable states removed explicitly',
                'Quotient consistency check on every class',
                'Witness search + language-equivalence tests',
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300"
                >
                  <Check
                    className="mt-0.5 h-3 w-3 shrink-0 text-[#6e7f63] dark:text-[#A8B5A0]"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <section className="mt-16 overflow-hidden rounded-lg bg-[#465447] px-6 py-10 text-[#F2F5EF] sm:px-10 dark:bg-[#2b372c]">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#C7D3C1]/80">
              Begin
            </p>
            <h2 className="mt-2 max-w-xl font-serif text-3xl font-semibold leading-tight sm:text-[38px]">
              Ready to see the table fill itself?
            </h2>
            <p className="mt-2.5 max-w-xl text-[13px] leading-relaxed text-[#C7D3C1]/90">
              Open the simulator, press play, and watch each comparison become a mark. Then try the
              same DFA by hand.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="btn !bg-[#F2F5EF] !px-5 !py-2.5 !text-xs !text-[#465447] hover:!bg-white focus-visible:!ring-[#C7D3C1] focus-visible:!ring-offset-[#465447]"
            >
              Launch simulator
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn !border !border-[#C7D3C1]/45 !px-5 !py-2.5 !text-xs !text-[#F2F5EF] hover:!bg-[#F2F5EF]/10 focus-visible:!ring-[#C7D3C1] focus-visible:!ring-offset-[#465447]"
            >
              Practice Arena
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
