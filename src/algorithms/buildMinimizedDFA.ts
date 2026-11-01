import type { DFA, EquivalenceGroup, MinimizedDFA } from '../types/automata'
import type { BuildResult } from '../types/simulation'
import { classLabel } from '../utils/automataHelpers'

/**
 * Builds the quotient automaton: one state per equivalence class.
 * Every member of a class must agree on accepting status and on the class of
 * its destination for every symbol. That consistency is asserted here rather
 * than assumed, so a bug in the marking phase can never silently produce an
 * incorrect quotient.
 */
export function buildMinimizedDFA(dfa: DFA, groups: string[][]): BuildResult {
  const inconsistencies: string[] = []
  const stateToClass: Record<string, string> = {}
  const classes: EquivalenceGroup[] = groups.map((members, index) => {
    const name = classLabel(members)
    for (const member of members) stateToClass[member] = name
    const finalFlags = members.map((member) => dfa.finalStates.includes(member))
    if (finalFlags.some((flag) => flag !== finalFlags[0])) {
      inconsistencies.push(
        `Group ${name} mixes accepting and non-accepting states, which should be impossible.`,
      )
    }
    return {
      name,
      members: [...members],
      isInitial: members.includes(dfa.initialState),
      isFinal: finalFlags[0] ?? false,
      colorIndex: index,
    }
  })

  const states = classes.map((group) => group.name)
  const initialGroup = classes.find((group) => group.isInitial)
  const finalStates = classes.filter((group) => group.isFinal).map((group) => group.name)
  const transitions: MinimizedDFA['transitions'] = {}

  for (const group of classes) {
    transitions[group.name] = {}
    const representative = group.members[0]
    for (const symbol of dfa.alphabet) {
      const destination = dfa.transitions[representative]?.[symbol]
      const destinationClass = destination ? stateToClass[destination] : undefined
      if (!destinationClass) {
        inconsistencies.push(
          `No destination class for δ(${representative}, ${symbol}). Check the input DFA.`,
        )
        continue
      }
      for (const member of group.members) {
        const memberDestination = dfa.transitions[member]?.[symbol]
        const memberClass = memberDestination ? stateToClass[memberDestination] : undefined
        if (memberClass !== destinationClass) {
          inconsistencies.push(
            `Members of ${group.name} disagree on input ${symbol}: ${member} goes to ${memberDestination} (${memberClass ?? 'missing'}) but ${representative} goes to ${destination} (${destinationClass}).`,
          )
        }
      }
      transitions[group.name][symbol] = destinationClass
    }
  }

  const minimized: MinimizedDFA = {
    states,
    alphabet: [...dfa.alphabet],
    initialState: initialGroup?.name ?? states[0] ?? '',
    finalStates,
    transitions,
    groups: classes,
    stateToClass,
  }

  return {
    minimized,
    groups: classes,
    consistent: inconsistencies.length === 0,
    inconsistencies,
  }
}
