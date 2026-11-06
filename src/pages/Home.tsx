import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Layers,
  Network,
  Play,
  Sparkles,
  TableProperties,
} from 'lucide-react'
import type { Page } from '../types/app'
import { analyzeDFA } from '../algorithms/analyze'
import { STARTER_DFA } from '../data/starter'
import { CHALLENGES } from '../data/challenges'
import { MiniDFAGraph } from '../components/MiniDFAGraph'
import { cn } from '../utils/cn'

const STARTER = analyzeDFA(STARTER_DFA)

const STEPS = [
  {
    step: '01',
    icon: Network,
    title: 'Define your DFA',
    description:
      'Enter transitions in the interactive table, build visually with the graph editor, or load a preset challenge.',
  },
  {
    step: '02',
    icon: TableProperties,
    title: 'Step-by-step marking',
    description:
      'Watch unreachable states get pruned, initial final/non-final pairs marked, and subsequent rounds fill to a fixed point.',
  },
  {
    step: '03',
    icon: Layers,
    title: 'Minimal quotient DFA',
    description:
      'Unmarked pairs form Myhill–Nerode equivalence classes, generating the smallest possible equivalent DFA.',
  },
]

interface HomeProps {
  onNavigate: (page: Page) => void
  onOpenChallenge: (challengeId: string) => void
}

export function Home({ onNavigate, onOpenChallenge }: HomeProps) {
  // Take 3 representative challenges (one easy, one medium, one hard)
  const featuredChallenges = CHALLENGES.slice(0, 3)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      {/* Hero Section */}
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C7D3C1] bg-[#F2F5EF] px-3 py-1 text-xs font-medium text-[#465447] dark:border-[#3a443a] dark:bg-[#1f2620] dark:text-[#C7D3C1]">
            <Sparkles className="h-3.5 w-3.5 text-[#6e7f63] dark:text-[#A8B5A0]" />
            <span>Automata Theory & Computation</span>
          </div>

          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-[#292D29] sm:text-5xl lg:text-[54px] lg:leading-[1.1] dark:text-[#F2F5EF]">
            DFA Minimization,{' '}
            <span className="italic text-[#465447] dark:text-[#A8B5A0]">made simple.</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#465447] dark:text-slate-300">
            An interactive simulator for the Table-Filling (Myhill–Nerode) algorithm. Step through
            unreachable state removal, live pair marking, and equivalence class merging without the
            usual confusion.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="btn btn-primary !px-5 !py-2.5 !text-xs"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              Open Simulator
            </button>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn btn-secondary !px-5 !py-2.5 !text-xs"
            >
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Practice Challenges
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#465447]/90 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#6e7f63] dark:text-[#A8B5A0]" />
              Interactive visual step controls
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#6e7f63] dark:text-[#A8B5A0]" />
              Graph + table dual view
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-[#6e7f63] dark:text-[#A8B5A0]" />
              Real-time equivalence grouping
            </span>
          </div>
        </div>

        {/* Live Starter Preview Card */}
        <div className="lg:col-span-5">
          <div className="app-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#C7D3C1]/60 px-4 py-3 dark:border-[#333c34]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#3a463b]/75 dark:text-[#C7D3C1]/75">
                  Live Example
                </p>
                <h3 className="font-serif text-base font-semibold text-[#292D29] dark:text-[#F2F5EF]">
                  5 original states → {STARTER.minimized?.states.length ?? 3} minimal states
                </h3>
              </div>
              <span className="chip chip-emerald text-[11px]">
                {(STARTER.groups ?? []).length} Equivalence Classes
              </span>
            </div>

            <div className="border-b border-[#C7D3C1]/40 bg-[#F2F5EF]/60 p-2 dark:border-[#333c34] dark:bg-[#161c17]">
              <MiniDFAGraph dfa={STARTER_DFA} className="h-[210px]" label="Starter DFA preview" />
            </div>

            <div className="p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[#465447] dark:text-slate-300">
                  Classes:
                </span>
                {(STARTER.groups ?? []).map((group, index) => (
                  <span
                    key={group.join(',')}
                    className="rounded border border-[#A8B5A0]/60 bg-[#F2F5EF] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#3e4c3f] dark:border-[#A8B5A0]/20 dark:bg-[#A8B5A0]/10 dark:text-[#C7D3C1]"
                  >
                    [{group.join(', ')}]
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onNavigate('simulator')}
                className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#A8B5A0]/60 bg-white/70 py-2 text-xs font-semibold text-[#465447] transition hover:bg-white dark:border-[#3a443a] dark:bg-[#202720] dark:text-[#C7D3C1] dark:hover:bg-[#283228]"
              >
                <span>Simulate this example</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="mt-16 border-t border-[#C7D3C1]/60 pt-10 dark:border-[#333c34]">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6e7f63] dark:text-[#A8B5A0]">
            Simple 3-Step Process
          </p>
          <h2 className="mt-1.5 font-serif text-2xl font-semibold text-[#292D29] sm:text-3xl dark:text-[#F2F5EF]">
            How the simulator works
          </h2>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {STEPS.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.step}
                className="app-card relative p-5 transition hover:shadow-md dark:hover:border-[#465447]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#A8B5A0]/20 text-[#465447] dark:bg-[#A8B5A0]/10 dark:text-[#C7D3C1]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#8a6d38] dark:text-[#dcc295]">
                    {item.step}
                  </span>
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-[#292D29] dark:text-[#F2F5EF]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-[#465447] dark:text-slate-300">
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Featured Challenges */}
      <section className="mt-14 border-t border-[#C7D3C1]/60 pt-10 dark:border-[#333c34]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#6e7f63] dark:text-[#A8B5A0]">
              Hands-on Learning
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-[#292D29] sm:text-3xl dark:text-[#F2F5EF]">
              Practice Challenges
            </h2>
            <p className="mt-1 text-xs text-[#465447] dark:text-slate-400">
              Test your intuition on curated DFAs with instant step verification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('practice')}
            className="btn btn-secondary !text-xs"
          >
            See all challenges
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {featuredChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="app-card flex flex-col justify-between p-4 transition hover:border-[#465447] dark:hover:border-[#A8B5A0]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#6e7f63] dark:text-[#A8B5A0]">
                    Q{challenge.number}
                  </span>
                  <span
                    className={cn(
                      'chip !px-2 !py-0.5 !text-[10px]',
                      challenge.difficulty === 'Easy'
                        ? 'chip-emerald'
                        : challenge.difficulty === 'Medium'
                          ? 'chip-amber'
                          : 'chip-rose',
                    )}
                  >
                    {challenge.difficulty}
                  </span>
                </div>
                <h3 className="mt-2.5 font-serif text-base font-semibold text-[#292D29] dark:text-[#F2F5EF]">
                  {challenge.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#465447] line-clamp-2 dark:text-slate-300">
                  {challenge.tagline}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenChallenge(challenge.id)}
                className="mt-4 flex items-center justify-between border-t border-[#C7D3C1]/50 pt-2.5 text-xs font-semibold text-[#465447] transition hover:text-[#292D29] dark:border-[#333c34] dark:text-[#C7D3C1] dark:hover:text-white"
              >
                <span>Solve challenge</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Clean Call to Action */}
      <section className="mt-14 overflow-hidden rounded-xl bg-[#465447] p-8 text-[#F2F5EF] sm:p-10 dark:bg-[#242e25]">
        <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          <div>
            <h2 className="font-serif text-2xl font-semibold sm:text-3xl">
              Ready to minimize your DFA?
            </h2>
            <p className="mt-1.5 max-w-lg text-xs leading-relaxed text-[#C7D3C1]">
              Open the simulator to create your own automaton, or practice with our guided challenges.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="btn !bg-[#F2F5EF] !px-4 !py-2.5 !text-xs !text-[#465447] hover:!bg-white"
            >
              <Play className="h-3.5 w-3.5" />
              Launch Simulator
            </button>
            <button
              type="button"
              onClick={() => onNavigate('practice')}
              className="btn !border !border-[#C7D3C1]/50 !bg-transparent !px-4 !py-2.5 !text-xs !text-[#F2F5EF] hover:!bg-[#F2F5EF]/10"
            >
              Practice Arena
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
