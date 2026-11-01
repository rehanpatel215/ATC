import { useMemo } from 'react'
import type { DFA } from '../types/automata'
import { useTheme } from '../hooks/theme-context'
import { buildDfaSvg } from '../utils/exportHelpers'
import { cn } from '../utils/cn'

interface MiniDFAGraphProps {
  dfa: DFA
  className?: string
  label?: string
}

/** Lightweight non-interactive SVG used in cards, previews and the hero. */
export function MiniDFAGraph({ dfa, className, label }: MiniDFAGraphProps) {
  const { theme } = useTheme()
  const markup = useMemo(() => buildDfaSvg(dfa, { theme }), [dfa, theme])

  return (
    <div
      className={cn('overflow-hidden [&>svg]:h-full [&>svg]:w-full', className)}
      dangerouslySetInnerHTML={{ __html: markup }}
      aria-label={label ?? 'DFA state diagram'}
    />
  )
}
