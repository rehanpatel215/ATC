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
            ? 'text-[#465447] dark:text-[#A8B5A0]'
            : 'text-[#3a463b]/75 dark:text-[#C7D3C1]/70',
        )}
      >
        {label}
      </p>
      <div className="mt-1 text-xs leading-relaxed text-[#292D29]/85 dark:text-slate-300">{children}</div>
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
        <p className="mt-1 text-xs text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
          Fix the DFA input to generate a walkthrough.
        </p>
      </div>
    )
  }

  const meta = PHASE_META[step.phase] ?? { label: step.phase, tone: 'chip-neutral' }
  const progress = lastIndex === 0 ? 0 : Math.round((index / lastIndex) * 100)

  return (
    <div className="app-card flex min-h-[320px] flex-col overflow-hidden">
      <div className="border-b border-[#C7D3C1]/60 px-4 py-3 dark:border-[#333c34]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={cn('chip !py-0.5 !text-[10px]', meta.tone)}>{meta.label}</span>
          <span className="font-mono text-[10px] font-semibold text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
            Step {index + 1} of {total}
          </span>
        </div>

        <div className="mt-2.5 flex gap-2">
          <span
            className={cn(
              'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md',
              step.phase === 'done'
                ? 'bg-[#e7ede3] text-[#3e4c3f] dark:bg-[#A8B5A0]/15 dark:text-[#C7D3C1]'
                : step.phase === 'refinement'
                  ? 'bg-[#f6efdf] text-[#765c2e] dark:bg-[#8a6d38]/15 dark:text-[#dcc295]'
                  : 'bg-[#A8B5A0]/25 text-[#465447] dark:bg-[#A8B5A0]/12 dark:text-[#C7D3C1]',
            )}
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <h2 className="animate-step text-sm font-semibold leading-snug tracking-tight text-[#292D29] dark:text-slate-50">
            {step.title}
          </h2>
        </div>

        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-[#C7D3C1]/50 dark:bg-[#333c34]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Walkthrough progress"
        >
          <div
            className="h-full rounded-full bg-[#465447] transition-[width] duration-300 dark:bg-[#A8B5A0]"
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
          <div className="rounded-lg border border-[#C7D3C1] bg-[#F2F5EF]/70 px-2.5 py-2 dark:border-[#3a443a] dark:bg-[#263026]/50">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#465447] dark:text-[#A8B5A0]">
              <Lightbulb className="h-3 w-3" aria-hidden="true" />
              Example
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-[#292D29]/85 dark:text-[#C7D3C1]/85">
              {step.example}
            </p>
          </div>
        )}

        {step.comparisons && step.comparisons.length > 0 && step.pair && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
              Symbol-by-symbol check for {formatPair(step.pair)}
            </p>
            <div className="mt-1.5 overflow-hidden rounded-lg border border-[#C7D3C1] dark:border-[#3a443a]">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#F2F5EF] dark:bg-[#263026]/70">
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                      Input
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                      δ({step.pair.a}, a)
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                      δ({step.pair.b}, a)
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                      Destination pair
                    </th>
                    <th className="px-2 py-1.5 text-left text-[9px] font-semibold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
                      Outcome
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {step.comparisons.map((comparison) => (
                    <tr
                      key={comparison.symbol}
                      className={cn(
                        'border-t border-[#C7D3C1]/60 dark:border-[#333c34]',
                        comparison.distinguishable && 'bg-[#f7ece7]/70 dark:bg-[#7c4232]/12',
                      )}
                    >
                      <td className="px-2 py-1.5 font-mono font-semibold text-[#292D29] dark:text-slate-100">
                        {comparison.symbol}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[#3a463b]/85 dark:text-slate-300">
                        {comparison.dest1}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[#3a463b]/85 dark:text-slate-300">
                        {comparison.dest2}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[#3a463b]/85 dark:text-slate-300">
                        {comparison.sameDestination
                          ? 'same state'
                          : comparison.destPair
                            ? formatPair(comparison.destPair)
                            : '—'}
                      </td>
                      <td className="px-2 py-1.5">
                        {comparison.sameDestination ? (
                          <span className="text-[10px] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
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
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
              Details
            </p>
            <ul className="mt-1.5 space-y-1">
              {step.bullets.map((bullet, bulletIndex) => (
                <li
                  key={`${bulletIndex}-${bullet.slice(0, 12)}`}
                  className="flex gap-1.5 text-[11px] leading-relaxed text-[#3a463b]/85 dark:text-slate-300"
                >
                  <span
                    className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#A8B5A0] dark:bg-[#6b776b]"
                    aria-hidden="true"
                  />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {step.technical && (
          <details className="group rounded-lg border border-[#C7D3C1] bg-[#F2F5EF]/50 dark:border-[#3a443a] dark:bg-[#263026]/40">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#3a463b]/75 marker:hidden dark:text-[#C7D3C1]/70 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-1.5">
                <Sigma className="h-3 w-3" aria-hidden="true" />
                Technical explanation
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <p className="border-t border-[#C7D3C1]/60 px-2.5 py-2 text-[11px] leading-relaxed text-[#3a463b]/85 dark:border-[#333c34] dark:text-slate-300">
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
    <div className="rounded-lg border border-[#C7D3C1] bg-[#FAFAF7]/70 px-2.5 py-2 dark:border-[#3a443a] dark:bg-[#263026]/40">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#3a463b]/75 dark:text-[#C7D3C1]/70">
        Reachability so far
      </p>
      <div className="mt-1 flex flex-wrap gap-1">
        {step.reachable.map((state) => (
          <span
            key={state}
            className={cn(
              'rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold',
              step.visited.includes(state)
                ? 'border-[#A8B5A0] bg-[#e7ede3] text-[#3e4c3f] dark:border-[#A8B5A0]/40 dark:bg-[#A8B5A0]/12 dark:text-[#C7D3C1]'
                : 'border-[#C7D3C1]/70 bg-[#FAFAF7] text-[#3a463b]/75 dark:border-[#3a443a] dark:bg-[#1b211c] dark:text-[#C7D3C1]/70',
            )}
          >
            {state}
          </span>
        ))}
        {step.unreachable.map((state) => (
          <span
            key={state}
            className="rounded border border-dashed border-[#C7D3C1] px-1.5 py-0.5 font-mono text-[10px] text-[#3a463b]/75 line-through dark:border-[#3a443a] dark:text-[#C7D3C1]/70"
          >
            {state}
          </span>
        ))}
      </div>
    </div>
  )
}
