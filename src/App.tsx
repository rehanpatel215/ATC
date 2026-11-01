import { useCallback, useEffect, useState } from 'react'
import type { DFA } from './types/automata'
import type { DFASource, Page } from './types/app'
import type { Challenge } from './data/challenges'
import { getChallenge } from './data/challenges'
import { SPEC_EXAMPLE_DFA, STARTER_DFA } from './data/starter'
import { cloneDFA, makeEmptyDFA } from './utils/automataHelpers'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { Simulator } from './pages/Simulator'
import { Practice } from './pages/Practice'

const PAGES: Page[] = ['home', 'simulator', 'practice']

function pageFromHash(hash: string): Page {
  const value = hash.replace(/^#\/?/, '')
  return PAGES.includes(value as Page) ? (value as Page) : 'home'
}

function withId(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id]
}

/**
 * Application shell. The hash router keeps the workspace state alive while the
 * user moves between the home page, the simulator and the practice arena.
 */
export default function App() {
  const [page, setPage] = useState<Page>(() =>
    typeof window === 'undefined' ? 'home' : pageFromHash(window.location.hash),
  )
  const [dfa, setDfa] = useState<DFA>(() => cloneDFA(STARTER_DFA))
  const [source, setSource] = useState<DFASource>({ kind: 'starter' })
  const [practiceSelection, setPracticeSelection] = useState<string | null>(null)
  const [attemptedIds, setAttemptedIds] = useState<string[]>([])
  const [revealedIds, setRevealedIds] = useState<string[]>([])

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const navigate = useCallback((next: Page) => {
    if (pageFromHash(window.location.hash) === next) {
      setPage(next)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    window.location.hash = next
  }, [])

  const challenge = source.kind === 'challenge' ? getChallenge(source.challengeId) : undefined
  const revealed = challenge ? revealedIds.includes(challenge.id) : false

  const loadPreset = useCallback((preset: DFA, kind: 'starter' | 'example') => {
    setDfa(cloneDFA(preset))
    setSource({ kind })
  }, [])

  const handleChangeDFA = useCallback((next: DFA) => {
    setDfa(next)
    setSource((current) => (current.kind === 'manual' ? current : { kind: 'manual' }))
  }, [])

  const handleResetDFA = useCallback(() => {
    if (source.kind === 'challenge') {
      const current = getChallenge(source.challengeId)
      if (current) {
        setDfa(cloneDFA(current.dfa))
        setSource({ kind: 'challenge', challengeId: current.id, autoStart: false })
      }
      return
    }
    if (source.kind === 'starter') {
      loadPreset(STARTER_DFA, 'starter')
      return
    }
    if (source.kind === 'example') {
      loadPreset(SPEC_EXAMPLE_DFA, 'example')
      return
    }
    setDfa(makeEmptyDFA())
    setSource({ kind: 'manual' })
  }, [source, loadPreset])

  const handleResetChallenge = useCallback(() => {
    if (source.kind !== 'challenge') return
    const current = getChallenge(source.challengeId)
    if (!current) return
    setDfa(cloneDFA(current.dfa))
    setSource({ kind: 'challenge', challengeId: current.id, autoStart: false })
  }, [source])

  const handleLoadStarter = useCallback(() => loadPreset(STARTER_DFA, 'starter'), [loadPreset])
  const handleLoadExample = useCallback(() => loadPreset(SPEC_EXAMPLE_DFA, 'example'), [loadPreset])

  const handleSolveChallenge = useCallback(
    (selected: Challenge) => {
      setDfa(cloneDFA(selected.dfa))
      setSource({ kind: 'challenge', challengeId: selected.id, autoStart: true })
      setAttemptedIds((current) => withId(current, selected.id))
      navigate('simulator')
    },
    [navigate],
  )

  const handleAttemptChallenge = useCallback((id: string) => {
    setAttemptedIds((current) => withId(current, id))
  }, [])

  const handleRevealChallenge = useCallback((id: string) => {
    setRevealedIds((current) => withId(current, id))
  }, [])

  const handleResetProgress = useCallback(
    (id: string) => {
      setAttemptedIds((current) => current.filter((entry) => entry !== id))
      setRevealedIds((current) => current.filter((entry) => entry !== id))
      if (source.kind === 'challenge' && source.challengeId === id) {
        const current = getChallenge(id)
        if (current) {
          setDfa(cloneDFA(current.dfa))
          setSource({ kind: 'challenge', challengeId: current.id, autoStart: false })
        }
      }
    },
    [source],
  )

  const handleOpenChallenge = useCallback(
    (id: string) => {
      setPracticeSelection(id)
      navigate('practice')
    },
    [navigate],
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-[#080e1a] dark:text-slate-100">
      <Header page={page} onNavigate={navigate} />

      <main className="flex-1">
        {page === 'home' && (
          <Home onNavigate={navigate} onOpenChallenge={handleOpenChallenge} />
        )}

        {page === 'simulator' && (
          <Simulator
            dfa={dfa}
            source={source}
            challenge={challenge}
            revealed={revealed}
            onReveal={() => {
              if (challenge) handleRevealChallenge(challenge.id)
            }}
            onResetChallenge={handleResetChallenge}
            onResetDFA={handleResetDFA}
            onLoadStarter={handleLoadStarter}
            onLoadExample={handleLoadExample}
            onChangeDFA={handleChangeDFA}
            onNavigate={navigate}
          />
        )}

        {page === 'practice' && (
          <Practice
            onSolve={handleSolveChallenge}
            attemptedIds={attemptedIds}
            revealedIds={revealedIds}
            onAttempt={handleAttemptChallenge}
            onReveal={handleRevealChallenge}
            onResetProgress={handleResetProgress}
            selectedId={practiceSelection}
            onSelect={setPracticeSelection}
          />
        )}
      </main>

      <footer className="border-t border-slate-200/70 bg-white/60 dark:border-slate-800/70 dark:bg-[#080e1a]/60">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-3 text-[10px] text-slate-400 sm:px-6 dark:text-slate-500">
          <span>
            AutomataLab · Table-filling DFA minimization · Theory of Computation
          </span>
          <span>React + TypeScript · deterministic, replayable walkthroughs</span>
        </div>
      </footer>
    </div>
  )
}
