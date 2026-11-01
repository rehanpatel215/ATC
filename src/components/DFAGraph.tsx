import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  EdgeLabelRenderer,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import { Check, LayoutGrid } from 'lucide-react'
import type { DFA, EquivalenceGroup, TransitionRef } from '../types/automata'
import { useTheme } from '../hooks/theme-context'
import { cn } from '../utils/cn'
import { groupColor, groupBadge } from '../utils/colors'
import { GRAPH_HEIGHT, NODE_SIZE, circularLayout, type Point } from '../utils/layout'

const RADIUS = 30

type StateNodeData = {
  label: string
  isInitial: boolean
  isFinal: boolean
  isFocused: boolean
  isFaded: boolean
  isVisited: boolean
  groupLabel?: string
  groupColor?: string
  canSelect: boolean
}

type StateNode = Node<StateNodeData, 'dfaState'>

type DfaEdgeData = {
  label: string
  from: string
  to: string
  active: boolean
  faded: boolean
  curve: number
  loopDirection: 1 | -1
}

type DfaEdge = Edge<DfaEdgeData, 'dfa'>

function StateNodeView({ data, selected }: NodeProps<StateNode>) {
  return (
    <div className="relative" style={{ width: NODE_SIZE, height: NODE_SIZE }}>
      {data.isInitial && (
        <div className="pointer-events-none absolute -left-[46px] top-1/2 flex -translate-y-1/2 items-center gap-0.5 text-indigo-600 dark:text-indigo-400">
          <span className="text-[8px] font-bold uppercase tracking-wide">start</span>
          <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true">
            <line x1="1" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.8" />
            <polygon points="21,5 12,1 12,9" fill="currentColor" />
          </svg>
        </div>
      )}

      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center rounded-full border-2 border-slate-500 bg-white text-center text-slate-900 shadow-sm transition-[box-shadow,border-color,opacity] dark:border-slate-400 dark:bg-[#0f1a2c] dark:text-slate-100',
          data.isFaded && 'border-dashed opacity-30',
          data.isFocused && 'node-focused ring-4 ring-amber-400/60',
          selected && 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#0b1220]',
          data.canSelect && 'cursor-pointer',
        )}
        style={data.groupColor ? { borderColor: data.groupColor } : undefined}
      >
        <span
          className={cn(
            'relative z-10 px-1.5 font-semibold leading-tight',
            data.label.length > 5 ? 'text-[9px]' : data.label.length > 3 ? 'text-[11px]' : 'text-sm',
          )}
        >
          {data.label}
        </span>
        {data.isFinal && (
          <span
            className="pointer-events-none absolute inset-[4px] rounded-full border-2 border-slate-500 dark:border-slate-400"
            style={data.groupColor ? { borderColor: data.groupColor } : undefined}
            aria-hidden="true"
          />
        )}
        {data.isVisited && (
          <span className="absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
      </div>

      {data.groupLabel && data.groupColor && (
        <span
          className="absolute -bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full px-1.5 py-0.5 text-[8px] font-bold text-white shadow-sm"
          style={{ backgroundColor: data.groupColor }}
        >
          {data.groupLabel}
        </span>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="dfa-handle"
        isConnectable
      />
      <Handle
        type="source"
        position={Position.Top}
        className="dfa-handle"
        isConnectable
      />
    </div>
  )
}

function arrowPoints(tip: Point, from: Point, size = 9, spread = 4.6): string {
  const dx = tip.x - from.x
  const dy = tip.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const ux = dx / length
  const uy = dy / length
  const baseX = tip.x - ux * size
  const baseY = tip.y - uy * size
  return [
    `${tip.x},${tip.y}`,
    `${baseX - uy * spread},${baseY + ux * spread}`,
    `${baseX + uy * spread},${baseY - ux * spread}`,
  ].join(' ')
}

function DfaEdgeView(props: EdgeProps<DfaEdge>) {
  const { sourceX, sourceY, targetX, targetY } = props
  const data = props.data
  if (!data) return null

  let path = ''
  let labelX = 0
  let labelY = 0
  let arrow = ''

  if (data.from === data.to) {
    const direction = data.loopDirection
    const start = { x: sourceX - 15, y: sourceY + direction * (RADIUS - 2) }
    const end = { x: sourceX + 15, y: sourceY + direction * (RADIUS - 2) }
    const first = { x: sourceX - 54, y: sourceY + direction * (RADIUS + 58) }
    const second = { x: sourceX + 54, y: sourceY + direction * (RADIUS + 58) }
    path = `M ${start.x} ${start.y} C ${first.x} ${first.y}, ${second.x} ${second.y}, ${end.x} ${end.y}`
    labelX = sourceX
    labelY = sourceY + direction * (RADIUS + 66)
    arrow = arrowPoints(end, second)
  } else {
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const length = Math.hypot(dx, dy) || 1
    const ux = dx / length
    const uy = dy / length
    const start = { x: sourceX + ux * (RADIUS + 1), y: sourceY + uy * (RADIUS + 1) }
    const end = { x: targetX - ux * (RADIUS + 2), y: targetY - uy * (RADIUS + 2) }
    const px = -uy
    const py = ux
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
    const control = {
      x: mid.x + px * data.curve * 2,
      y: mid.y + py * data.curve * 2,
    }
    path = `M ${start.x} ${start.y} Q ${control.x} ${control.y}, ${end.x} ${end.y}`
    labelX = mid.x + px * data.curve
    labelY = mid.y + py * data.curve
    arrow = arrowPoints(end, control)
  }

  const edgeClasses = data.faded
    ? 'stroke-slate-300 dark:stroke-slate-700'
    : data.active
      ? 'stroke-indigo-500 dark:stroke-indigo-400'
      : 'stroke-slate-400 dark:stroke-slate-500'
  const arrowClasses = data.faded
    ? 'fill-slate-300 dark:fill-slate-700'
    : data.active
      ? 'fill-indigo-500 dark:fill-indigo-400'
      : 'fill-slate-400 dark:fill-slate-500'

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="react-flow__edge-interaction"
      />
      <path
        d={path}
        fill="none"
        strokeWidth={data.active ? 2.6 : 1.7}
        strokeLinecap="round"
        className={cn(edgeClasses, data.active && 'dfa-edge-active', data.faded && 'opacity-40')}
      />
      <polygon points={arrow} className={cn(arrowClasses, data.faded && 'opacity-40')} />
      <EdgeLabelRenderer>
        <div
          className={cn(
            'pointer-events-none absolute z-10 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold shadow-sm transition-colors',
            data.faded
              ? 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
              : data.active
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/50 dark:bg-indigo-500/15 dark:text-indigo-200'
                : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-[#0f1a2c] dark:text-slate-300',
            props.selected && 'ring-2 ring-indigo-500/50',
          )}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = { dfaState: StateNodeView }
const edgeTypes = { dfa: DfaEdgeView }

export interface DFAGraphProps {
  dfa: DFA
  focusStates?: string[]
  activeTransitions?: TransitionRef[]
  fadedStates?: string[]
  showReachability?: boolean
  visited?: string[]
  groups?: EquivalenceGroup[]
  showGroups?: boolean
  selectedState?: string | null
  selectedEdge?: { from: string; to: string } | null
  onStateClick?: (state: string) => void
  onPaneClick?: () => void
  onEdgeSelect?: (from: string, to: string) => void
  connectable?: boolean
  onConnect?: (from: string, to: string) => void
  height?: number
  className?: string
  emptyMessage?: string
}

function GraphInner({
  dfa,
  focusStates,
  activeTransitions,
  fadedStates,
  showReachability,
  visited,
  groups,
  showGroups,
  selectedState,
  selectedEdge,
  onStateClick,
  onPaneClick,
  onEdgeSelect,
  connectable,
  onConnect,
  height = 380,
  className,
  emptyMessage = 'Add a state to begin.',
}: DFAGraphProps) {
  const { theme } = useTheme()
  const { fitView } = useReactFlow()
  const statesKey = dfa.states.join('\u0001')
  const layout = useMemo(() => circularLayout(dfa.states), [dfa.states])
  const [positions, setPositions] = useState<Record<string, Point>>({})

  useEffect(() => {
    setPositions((previous) => {
      const next: Record<string, Point> = {}
      for (const state of dfa.states) next[state] = previous[state] ?? layout[state]
      return next
    })
    // The layout is keyed by the state list; dfa.states is read alongside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statesKey, layout])

  const focusSet = useMemo(() => new Set(focusStates ?? []), [focusStates])
  const fadedSet = useMemo(() => new Set(fadedStates ?? []), [fadedStates])
  const visitedSet = useMemo(() => new Set(visited ?? []), [visited])
  const activeSet = useMemo(
    () =>
      new Set(
        (activeTransitions ?? []).map(
          (transition) => `${transition.from}\u0001${transition.symbol}\u0001${transition.to}`,
        ),
      ),
    [activeTransitions],
  )

  const groupMap = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {}
    if (showGroups && groups) {
      groups.forEach((group, index) => {
        for (const member of group.members) {
          map[member] = { label: groupBadge(index), color: groupColor(index) }
        }
      })
    }
    return map
  }, [groups, showGroups])

  const nodes = useMemo<StateNode[]>(
    () =>
      dfa.states.map((state) => {
        const point = positions[state] ?? layout[state] ?? { x: GRAPH_HEIGHT / 2, y: GRAPH_HEIGHT / 2 }
        const group = groupMap[state]
        return {
          id: state,
          type: 'dfaState',
          position: { x: point.x - NODE_SIZE / 2, y: point.y - NODE_SIZE / 2 },
          selected: selectedState === state,
          selectable: Boolean(onStateClick),
          data: {
            label: state,
            isInitial: state === dfa.initialState,
            isFinal: dfa.finalStates.includes(state),
            isFocused: focusSet.has(state),
            isFaded: fadedSet.has(state),
            isVisited: Boolean(showReachability) && visitedSet.has(state),
            groupLabel: group?.label,
            groupColor: group?.color,
            canSelect: Boolean(onStateClick),
          },
        }
      }),
    [
      dfa.states,
      dfa.initialState,
      dfa.finalStates,
      positions,
      layout,
      groupMap,
      focusSet,
      fadedSet,
      visitedSet,
      showReachability,
      selectedState,
      onStateClick,
    ],
  )

  const edges = useMemo<DfaEdge[]>(() => {
    const grouped = new Map<
      string,
      { from: string; to: string; symbols: string[]; active: boolean }
    >()
    for (const from of dfa.states) {
      for (const symbol of dfa.alphabet) {
        const to = dfa.transitions[from]?.[symbol]
        if (!to || !dfa.states.includes(to)) continue
        const key = `${from}\u0001${to}`
        const existing = grouped.get(key)
        const isActive = activeSet.has(`${from}\u0001${symbol}\u0001${to}`)
        if (existing) {
          existing.symbols.push(symbol)
          existing.active = existing.active || isActive
        } else {
          grouped.set(key, { from, to, symbols: [symbol], active: isActive })
        }
      }
    }

    const centerY = GRAPH_HEIGHT / 2 + 10
    return [...grouped.values()].map((edge, index) => {
      const reverse =
        edge.from !== edge.to && grouped.has(`${edge.to}\u0001${edge.from}`)
      const sourcePoint = positions[edge.from] ?? layout[edge.from]
      const loopDirection: 1 | -1 =
        (sourcePoint?.y ?? centerY) < centerY ? 1 : -1
      return {
        id: `dfa-edge-${index}`,
        source: edge.from,
        target: edge.to,
        type: 'dfa',
        selectable: Boolean(onEdgeSelect),
        selected:
          selectedEdge?.from === edge.from && selectedEdge?.to === edge.to,
        data: {
          label: edge.symbols.join(', '),
          from: edge.from,
          to: edge.to,
          active: edge.active,
          faded: fadedSet.has(edge.from) || fadedSet.has(edge.to),
          curve: reverse ? 38 : 0,
          loopDirection,
        },
      }
    })
  }, [
    dfa.states,
    dfa.alphabet,
    dfa.transitions,
    activeSet,
    fadedSet,
    positions,
    layout,
    onEdgeSelect,
    selectedEdge,
  ])

  const handleNodeDrag = useCallback((_event: unknown, node: Node) => {
    setPositions((previous) => ({
      ...previous,
      [node.id]: {
        x: node.position.x + NODE_SIZE / 2,
        y: node.position.y + NODE_SIZE / 2,
      },
    }))
  }, [])

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!onConnect || !connection.source || !connection.target) return
      onConnect(connection.source, connection.target)
    },
    [onConnect],
  )

  if (dfa.states.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
          className,
        )}
        style={{ height }}
      >
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-[#0a1322]',
        connectable && 'dfa-canvas-connectable',
        className,
      )}
      style={{ height }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDrag={handleNodeDrag}
        onNodeClick={(_event, node) => onStateClick?.(node.id)}
        onEdgeClick={(_event, edge) => {
          const data = edge.data as DfaEdgeData | undefined
          if (data) onEdgeSelect?.(data.from, data.to)
        }}
        onPaneClick={() => onPaneClick?.()}
        onConnect={handleConnect}
        nodesConnectable={Boolean(connectable)}
        nodesDraggable
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.22 }}
        minZoom={0.25}
        maxZoom={1.8}
        zoomOnScroll={false}
        panOnScroll
        connectionMode={'loose' as never}
        className="[&_.react-flow__node]:outline-none"
      >
        <Background
          color={theme === 'dark' ? '#1e293b' : '#d5dbe5'}
          gap={22}
          size={1.2}
        />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>

      <button
        type="button"
        onClick={() => {
          setPositions(layout)
          window.setTimeout(() => fitView({ padding: 0.22, duration: 300 }), 30)
        }}
        className="absolute right-2 top-2 z-20 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-slate-500 shadow-sm backdrop-blur transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-400 dark:hover:text-white"
        title="Reset layout"
        aria-label="Reset graph layout"
      >
        <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export function DFAGraph(props: DFAGraphProps) {
  return (
    <ReactFlowProvider>
      <GraphInner {...props} />
    </ReactFlowProvider>
  )
}
