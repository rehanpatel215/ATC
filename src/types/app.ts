export type Page = 'home' | 'simulator' | 'practice'

/**
 * Where the DFA currently in the workspace came from. Manual edits reset the
 * source to `manual` so the workspace never claims to be a pristine challenge.
 */
export type DFASource =
  | { kind: 'manual' }
  | { kind: 'starter' }
  | { kind: 'example' }
  | { kind: 'challenge'; challengeId: string; autoStart?: boolean }
