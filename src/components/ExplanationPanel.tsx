import { BookOpen, ChevronDown, Lightbulb, Sigma } from 'lucide-react'
import type { ReactNode } from 'react'
import type { AlgorithmStep } from '../types/simulation'
import { formatPair } from '../utils/automataHelpers'
import { PHASE_META } from '../utils/colors'
import { cn } from '../utils/cn'

interface ExplanationPanelProps {
  step: AlgorithmStep | undefined
  index: number
  total: number
  lastIndex: number
}

function Section({
  label,
  children,
  tone = 'default',
}: {
  label: string
  children: ReactNode
  tone?: 'default' | 'accent'
}) {
  return (
    <div>
      <p
        className={cn(
          'text-[10px] font-bold uppercase tracking-[0.12em]',
          tone === 'accent'
            ? 'text-indigo-600 dark:text-indigo-400'
            : 'text-slate-400 dark:text-slate-500',
        )}
      >
        {label}
      </p>
      <div className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  )
}

/**
 * The teaching panel. Every step carries its own plain-English explanation,
 * so stepping backwards simply renders a previous record — nothing is
 * recomputed and nothing can drift out of sync.
 */
export function ExplanationPanel({ step, index, total, lastIndex }: ExplanationPanelProps) {
  if (!step) {
    return (
      <div className="app-card card-pad">
        <h2 className="card-title">Explanation</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Fix the DFA input to generate a walkthrough.
        </p>
      </div>
    )
  }

  const meta = PHASE_META[step.phase] ?? { label: step.phase, tone: 'chip-neutral' }
  const progress = lastIndex === 0 ? 0 : Math.round((index / lastIndex) * 100)

  return (
    <div className="app-card flex min-h-[320px] flex-col overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={cn('chip !py-0.5 !text-[10px]', meta.tone)}>{meta.label}</span>
          <span className="font-mono text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Step {index + 1} of {total}
          </span>
        </div>

        <div className="mt-2.5 flex gap-2">
          <span
            className={cn(
              'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
              step.phase === 'done'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : step.phase === 'refinement'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
            )}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <h2 className="animate-step text-sm font-semibold leading-snug tracking-tight text-slate-900 dark:text-slate-50">
            {step.title}
          </h2>
        </div>

        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Walkthrough progress"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-[width] duration-300"
            style={{ width: `${Math.max(2, progress)}%` }}
          />
        </div>
      </div>

      <div className="panel-scroll flex-1 space-y-3.5 px-4 py-3.5">
        <Section label="What is happening?" tone="accent">
          {step.what}
        </Section>

        <Section label="Why is it required?">{step.why}</Section>

        <Section label="Operation">{step.operation}</Section>

        <Section label="Result">{step.result}</Section>

        {step.example && (
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-2.5 py-2 dark:border-indigo-500/20 dark:bg-indigo-500/10">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
              <Lightbulb className="h-3 w-3" aria-hidden="true" />
              Example
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-indigo-900/90 dark:text-indigo-100/90">
              {step.example}
            </p>
          </div>
        )}

        {step.comparisons && step.comparisons.length > 0 && step.pair && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Symbol-by-symbol check for {formatPair(step.pair)}
            </p>
            <div className="mt-1.5 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60">
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Input
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      δ({step.pair.a}, a)
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      δ({step.pair.b}, a)
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Destination pair
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Outcome
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {step.comparisons.map((comparison) => (
                    <tr
                      key={comparison.symbol}
                      className={cn(
                        'border-t border-slate-100 dark:border-slate-800',
                        comparison.distinguishable && 'bg-rose-50/70 dark:bg-rose-500/10',
                      )}
                    >
                      <td className="px-2 py-1.5 font-mono font-semibold text-slate-800 dark:text-slate-100">
                        {comparison.symbol}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-300">
                        {comparison.dest1}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-300">
                        {comparison.dest2}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-300">
                        {comparison.sameDestination
                          ? 'same state'
                          : comparison.destPair
                            ? formatPair(comparison.destPair)
                            : '—'}
                      </td>
                      <td className="px-2 py-1.5">
                        {comparison.sameDestination ? (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            no effect
                          </span>
                        ) : comparison.distinguishable ? (
                          <span className="chip chip-rose !px-1.5 !py-0 !text-[9px]">marked ✗</span>
                        ) : (
                          <span className="chip chip-neutral !px-1.5 !py-0 !text-[9px]">
                            not marked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step.bullets && step.bullets.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
              Details
            </p>
            <ul className="mt-1.5 space-y-1">
              {step.bullets.map((bullet, bulletIndex) => (
                <li
                  key={`${bulletIndex}-${bullet.slice(0, 12)}`}
                  className="flex gap-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300"
                >
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500"
                    aria-hidden="true"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step.technical && (
          <details className="group rounded-lg border border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 marker:hidden dark:text-slate-400 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5">
                <Sigma className="h-3 w-3" aria-hidden="true" />
                Technical explanation
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="border-t border-slate-200 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {step.technical}
            </p>
          </details>
        )}

        {step.showReachability && analysisNote(step)}
      </div>
    </div>
  )
}

function analysisNote(step: AlgorithmStep) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Reachability so far
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {step.reachable.map((state) => (
          <span
            key={state}
            className={cn(
              'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold',
              step.visited.includes(state)
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500',
            )}
          >
            {state}
          </span>
        ))}
        {step.unreachable.map((state) => (
          <span
            key={state}
            className="rounded border border-dashed border-slate-300 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 line-through dark:border-slate-600 dark:text-slate-500"
          >
            {state}
          </span>
        ))}
      </div>
    </div>
  )
}
