import { useState } from 'react'
import { cn } from '../utils/cn'

interface InlineInputProps {
  value: string
  onCommit: (next: string) => void
  className?: string
  ariaLabel: string
  title?: string
  maxLength?: number
}

/**
 * A tiny "edit in place" field. The draft is committed on Enter or blur and
 * discarded with Escape. If the parent rejects the change (duplicate name,
 * reserved character, …) the field snaps back to the previous valid value.
 */
export function InlineInput({
  value,
  onCommit,
  className,
  ariaLabel,
  title,
  maxLength = 24,
}: InlineInputProps) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // Keep the draft in sync with the committed value during render; the effect
  // version would render once with stale text after a rejected commit.
  if (lastValue !== value) {
    setLastValue(value)
    setDraft(value)
  }

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed && trimmed !== value) onCommit(trimmed)
    setDraft(value)
  }

  return (
    <input
      type="text"
      value={draft}
      maxLength={maxLength}
      aria-label={ariaLabel}
      title={title}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
          event.currentTarget.blur()
        }
        if (event.key === 'Escape') {
          setDraft(value)
          event.currentTarget.blur()
        }
      }}
      className={cn(
        'w-full min-w-0 rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-xs font-semibold text-[#292D29] outline-none transition-colors hover:border-[#C7D3C1] focus:border-[#A8B5A0] focus:bg-[#FAFAF7] focus:ring-2 focus:ring-[#A8B5A0]/30 dark:text-slate-100 dark:hover:border-[#3a443a] dark:focus:border-[#A8B5A0] dark:focus:bg-[#151a16]',
        className,
      )}
    />
  )
}
