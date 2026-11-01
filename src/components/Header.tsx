import { GraduationCap, House, TableProperties, Workflow } from 'lucide-react'
import type { Page } from '../types/app'
import { ThemeToggle } from './ThemeToggle'

const NAV_ITEMS: Array<{ id: Page; label: string; icon: typeof House }> = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'simulator', label: 'Manual DFA', icon: TableProperties },
  { id: 'practice', label: 'Practice Arena', icon: GraduationCap },
]

interface HeaderProps {
  page: Page
  onNavigate: (page: Page) => void
}

export function Header({ page, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#080e1a]/85">
      <div className="mx-auto flex h-[64px] max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="AutomataLab home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-600/30 transition-transform duration-200 group-hover:scale-105">
            <Workflow className="h-[19px] w-[19px]" aria-hidden="true" />
          </span>
          <span className="text-left">
            <span className="block text-[15px] font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
              AutomataLab
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400 sm:block dark:text-slate-500">
              Explore. Visualize. Minimize.
            </span>
          </span>
        </button>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 lg:inline-flex dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400">
            Table-filling method
          </span>
          <ThemeToggle />
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5 md:hidden dark:border-slate-800/70"
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {item.label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
