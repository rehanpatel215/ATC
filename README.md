# AutomataLab

An interactive **DFA minimization simulator** built around the **Table-Filling Method**. Instead of only printing the minimized automaton, AutomataLab walks through validation, reachability pruning, pair generation, every marking round, the fixed point, the equivalence classes, and the quotient construction.

Built with React, Vite, TypeScript, Tailwind CSS, Lucide React, and `@xyflow/react`. The algorithm is pure TypeScript with no backend, database, or external computational service.

## Features

- **Two DFA input modes**
  - Editable transition table with validation messages.
  - Interactive graph builder: add/rename/delete states, toggle accepting states, edit the alphabet, drag connections, and inspect or delete transitions.
- **Step-by-step walkthrough**
  - Reachability analysis with unreachable states faded and removed explicitly.
  - `n(n−1)/2` unordered state pairs in a triangular matrix.
  - Initial final/non-final marking followed by fixed-point refinement rounds.
  - Symbol-by-symbol explanations for every pair evaluation and a shortest distinguishing witness.
- **Playback controls**
  - Previous, Next, Reset, and Jump-to-step.
  - Play/Pause/Resume/Restart autoplay at 0.5×, 1×, 1.5×, and 2× speed. Timers are cleaned up on pause, reset, and unmount.
- **Result summary**
  - Real statistics, original and minimized graphs and tables, equivalence groups, distinguishable/equivalent pair lists.
  - CSV, SVG, and PNG exports plus a print/PDF report.
- **Practice Arena**
  - Six independently verified challenges: 2 Easy, 2 Medium, 2 Hard, all over `{0,1}`.
  - Solutions stay hidden until an explicit confirmation, or can be revealed immediately after starting an attempt.
  - Challenge selection and attempt/reveal status survive page navigation.
- **Themes and responsive layout**
  - Light/dark theme with `localStorage` persistence and a pre-paint theme script.
  - Desktop layout: input on the left, graphs in the centre, explanation on the right, pair matrix and controls along the bottom.
  - Smaller screens stack the same panels without horizontal overflow.

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite (usually `http://localhost:5173`).

Other commands:

```bash
npm run build     # type-check and production build
npm run preview   # serve the production build
npm test          # run the Vitest suite
npm run typecheck # run TypeScript only
```

## How the algorithm is organized

| File | Responsibility |
| --- | --- |
| `src/algorithms/validation.ts` | Completeness and consistency checks with human-readable errors. |
| `src/algorithms/reachability.ts` | Breadth-first reachability from the initial state. |
| `src/algorithms/tableFilling.ts` | Pair generation, initial marking, fixed-point refinement, equivalence groups. |
| `src/algorithms/buildMinimizedDFA.ts` | Quotient construction and consistency checks. |
| `src/algorithms/analyze.ts` | Records every operation as a replayable `AlgorithmStep`. |
| `src/algorithms/verification.ts` | Witness search and language-equivalence checks. |
| `src/hooks/useSimulation.ts` | Manual stepping, autoplay, speed, jump, and timer cleanup. |

The UI never recomputes the result while stepping. `analyzeDFA` produces an immutable list of steps once per DFA, and both manual and automatic playback render those same records. That keeps the visuals, explanations, and statistics synchronized even when stepping backwards.

## Verification

The Vitest suite covers:

- Validation failures: undefined transitions, dangling destinations, duplicate states/symbols, and invalid initial states.
- Reachability and explicit removal of unreachable states.
- Initial marking, multiple refinement rounds, monotone snapshots, self-loops, identical destinations, and alphabets of different sizes.
- All six challenge answers against both the table-filling implementation and an independent partition-refinement reference.
- Quotient consistency, witness-based pair verification, and language equivalence between each original DFA and its minimized counterpart.

Current status: **113 tests passing** across 2 test files.

## Project structure

```text
src/
  algorithms/    pure TypeScript minimization pipeline
  components/    graph, tables, controls, explanation, results, practice UI
  data/          starter/spec examples and six verified challenges
  hooks/         theme and playback state
  pages/         Home, Simulator, Practice
  tests/         Vitest suites and independent reference implementation
  types/         automata, simulation, and app types
  utils/         DFA editing helpers, layout, colors, exports
```

## Notes

- State names may not contain commas, brackets, parentheses, or the internal pair separator, because class labels are rendered as `[A,B]`.
- The graph canvas uses the original state declaration order consistently for pairs, groups, and class labels.
- React Flow attribution is kept visible in the graph canvas.
