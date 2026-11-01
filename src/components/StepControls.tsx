import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import type { SimulationApi } from '../hooks/useSimulation'
import { SPEED_OPTIONS } from '../hooks/useSimulation'
import { PHASE_META } from '../utils/colors'
import { cn } from '../utils/cn'

const PHASE_ORDER = [
  'validate',
  'reachability',
  'pairs',
  'initial',
  'refinement',
  'equivalence',
  'build',
  'done',
] as const

interface StepControlsProps {
  sim: SimulationApi
  className?: string
}

/**
 * Shared control bar for manual stepping and automatic playback. Both modes
 * read the same recorded step list from useSimulation, so they always show the
 * same states.
 */
export function StepControls({ sim, className }: StepControlsProps) {
  const {
    analysis,
    index,
    total,
    playing,
    started,
    speed,
    canInteract,
    isAtEnd,
    progress,
    currentStep,
  } = sim

  const disabled = !canInteract
  const phase = currentStep?.phase ?? 'validate'
  const playLabel = playing ? 'Pause' : isAtEnd ? 'Replay' : started && index > 0 ? 'Resume' : 'Play'

  return (
    <div className={cn('app-card card-pad', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="card-title">Execution</h2>
          <span className={cn('chip !py-0.5 !text-[10px]', playing ? 'chip-indigo' : 'chip-neutral')}>
            {playing ? 'Auto playback' : started ? 'Manual stepping' : 'Ready'}
          </span>
          {analysis.markingRounds > 0 && (
            <span className="hidden text-[10px] text-slate-500 sm:inline dark:text-slate-400">
              {analysis.markingRounds} marking round{analysis.markingRounds === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Step {index + 1} / {total}
          </span>
          <span className="hidden font-mono text-[10px] text-slate-400 sm:inline dark:text-slate-500">
            {progress}%
          </span>
        </div>
      </div>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={Math.max(1, total)}
        aria-valuenow={index + 1}
        aria-label="Algorithm progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-[width] duration-300"
          style={{ width: `${Math.max(1.5, ((index + 1) / Math.max(1, total)) * 100)}%` }}
        />
      </div>

      <div className="mt-2 hidden flex-wrap items-center gap-x-1 gap-y-1 sm:flex">
        {PHASE_ORDER.map((entry, phaseIndex) => {
          const active = phase === entry
          const reached = PHASE_ORDER.indexOf(phase as (typeof PHASE_ORDER)[number]) >= phaseIndex
          return (
            <span
              key={entry}
              className={cn(
                'inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide',
                active
                  ? 'text-indigo-700 dark:text-indigo-300'
                  : reached
                    ? 'text-slate-500 dark:text-slate-400'
                    : 'text-slate-300 dark:text-slate-600',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  active
                    ? 'animate-pulse bg-indigo-500'
                    : reached
                      ? 'bg-slate-400 dark:bg-slate-500'
                      : 'bg-slate-200 dark:bg-slate-700',
                )}
                aria-hidden="true"
              />
              {PHASE_META[entry]?.label ?? entry}
              {phaseIndex < PHASE_ORDER.length - 1 && (
                <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
                  /
                </span>
              )}
            </span>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={sim.previous}
          disabled={disabled || index === 0}
          className="btn btn-secondary btn-sm"
          title="Previous step"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          onClick={sim.next}
          disabled={disabled || isAtEnd}
          className="btn btn-primary btn-sm"
          title="Next step"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => (playing ? sim.pause() : sim.play())}
          disabled={disabled}
          className={cn('btn btn-sm', playing ? 'btn-secondary' : 'btn-success')}
          title={playing ? 'Pause automatic playback' : 'Start automatic playback'}
          aria-label={playing ? 'Pause playback' : 'Play walkthrough automatically'}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {playLabel}
        </button>
        <button
          type="button"
          onClick={sim.restart}
          disabled={disabled}
          className="btn btn-secondary btn-sm"
          title="Restart automatic playback from step 1"
        >
          <SkipBack className="h-3.5 w-3.5" aria-hidden="true" />
          Restart
        </button>
        <button
          type="button"
          onClick={sim.reset}
          disabled={disabled}
          className="btn btn-ghost btn-sm"
          title="Return to the first step"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </button>

        <div className="mx-1 hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-700" />

        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
          Jump
          <select
            value={index}
            onChange={(event) => sim.jumpTo(Number(event.target.value))}
            disabled={disabled}
            className="select !w-auto max-w-[190px] !py-1 !text-[10px] font-medium normal-case tracking-normal"
            aria-label="Jump to a step"
          >
            {analysis.steps.map((step, stepIndex) => (
              <option key={step.index} value={stepIndex}>
                {stepIndex + 1}. {step.title.length > 46 ? `${step.title.slice(0, 44)}…` : step.title}
              </option>
            ))}
          </select>
        </label>

        <div className="ml-auto flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            Speed
          </span>
          <div className="flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => sim.setSpeed(option)}
                aria-pressed={speed === option}
                className={cn(
                  'px-2 py-1 text-[10px] font-semibold transition-colors',
                  speed === option
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {option}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {!analysis.valid && (
        <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400">
          Execution is disabled until the DFA is valid. See the validation messages in the input
          panel.
        </p>
      )}
    </div>
  )
}
