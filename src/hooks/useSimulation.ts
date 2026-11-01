import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DFA } from '../types/automata'
import type { Analysis } from '../types/simulation'
import { analyzeDFA } from '../algorithms/analyze'

export type PlaybackSpeed = 0.5 | 1 | 1.5 | 2

export const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 1.5, 2]

const BASE_INTERVAL = 1600

export interface SimulationApi {
  analysis: Analysis
  currentStep: Analysis['steps'][number] | undefined
  index: number
  total: number
  lastIndex: number
  started: boolean
  playing: boolean
  speed: PlaybackSpeed
  canInteract: boolean
  isAtEnd: boolean
  progress: number
  start: () => void
  next: () => void
  previous: () => void
  reset: () => void
  jumpTo: (index: number) => void
  play: () => void
  pause: () => void
  restart: () => void
  setSpeed: (speed: PlaybackSpeed) => void
}

interface PlaybackState {
  /** The analysis this playback state belongs to. */
  analysis: Analysis
  index: number
  started: boolean
  playing: boolean
}

function freshState(analysis: Analysis): PlaybackState {
  return { analysis, index: 0, started: false, playing: false }
}

/**
 * Owns playback state only. The algorithm itself lives in analyzeDFA and is
 * computed once per DFA; manual stepping and autoplay both read the same
 * recorded step array, so the two modes can never diverge.
 */
export function useSimulation(dfa: DFA): SimulationApi {
  const analysis = useMemo(() => analyzeDFA(dfa), [dfa])
  const [state, setState] = useState<PlaybackState>(() => freshState(analysis))
  const [speed, setSpeed] = useState<PlaybackSpeed>(1)

  // A different DFA produces a different analysis; reset in the same render
  // pass instead of waiting for an effect.
  if (state.analysis !== analysis) {
    setState(freshState(analysis))
  }

  const total = analysis.steps.length
  const lastIndex = Math.max(0, total - 1)
  const canInteract = analysis.valid && total > 1
  const { index, started, playing } = state
  const isAtEnd = index >= lastIndex

  // Autoplay uses a single self-cleaning timeout. Pausing, unmounting or
  // resetting removes the pending timer immediately.
  useEffect(() => {
    if (!playing || !analysis.valid || index >= lastIndex) return
    const delay = Math.max(260, Math.round(BASE_INTERVAL / speed))
    const timer = window.setTimeout(() => {
      setState((current) => {
        const nextIndex = Math.min(current.index + 1, lastIndex)
        return {
          ...current,
          index: nextIndex,
          // Reaching the final step stops playback on its own.
          playing: nextIndex < lastIndex,
        }
      })
    }, delay)
    return () => window.clearTimeout(timer)
  }, [playing, index, lastIndex, speed, analysis.valid])

  const start = useCallback(() => {
    if (!analysis.valid) return
    setState((current) => ({ ...current, index: 0, started: true, playing: false }))
  }, [analysis.valid])

  const next = useCallback(() => {
    if (!analysis.valid) return
    setState((current) => ({
      ...current,
      playing: false,
      started: true,
      index: Math.min(current.index + 1, lastIndex),
    }))
  }, [analysis.valid, lastIndex])

  const previous = useCallback(() => {
    if (!analysis.valid) return
    setState((current) => ({
      ...current,
      playing: false,
      started: true,
      index: Math.max(0, current.index - 1),
    }))
  }, [analysis.valid])

  const reset = useCallback(() => {
    setState((current) => ({
      ...current,
      playing: false,
      started: true,
      index: 0,
    }))
  }, [])

  const jumpTo = useCallback(
    (target: number) => {
      if (!analysis.valid) return
      setState((current) => ({
        ...current,
        playing: false,
        started: true,
        index: Math.min(Math.max(0, Math.round(target)), lastIndex),
      }))
    },
    [analysis.valid, lastIndex],
  )

  const play = useCallback(() => {
    if (!analysis.valid) return
    setState((current) => ({
      ...current,
      started: true,
      index: !current.started || current.index >= lastIndex ? 0 : current.index,
      playing: true,
    }))
  }, [analysis.valid, lastIndex])

  const pause = useCallback(() => {
    setState((current) => ({ ...current, playing: false }))
  }, [])

  const restart = useCallback(() => {
    if (!analysis.valid) return
    setState((current) => ({ ...current, started: true, index: 0, playing: true }))
  }, [analysis.valid])

  const currentStep = started ? analysis.steps[Math.min(index, lastIndex)] : analysis.steps[0]
  const progress = lastIndex === 0 ? 0 : Math.min(100, Math.round((index / lastIndex) * 100))

  return {
    analysis,
    currentStep,
    index,
    total,
    lastIndex,
    started,
    playing,
    speed,
    canInteract,
    isAtEnd,
    progress,
    start,
    next,
    previous,
    reset,
    jumpTo,
    play,
    pause,
    restart,
    setSpeed,
  }
}
