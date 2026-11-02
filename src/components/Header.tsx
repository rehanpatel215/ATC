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
    <header className="sticky top-0 z-40 border-b border-[#C7D3C1]/70 bg-[#FAFAF7]/90 backdrop-blur-md dark:border-[#333c34] dark:bg-[#151a16]/90">
      <div className="mx-auto flex h-[68px] max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2.5 rounded-md py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465447] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF7] dark:focus-visible:ring-[#A8B5A0] dark:focus-visible:ring-offset-[#151a16]"
          aria-label="AutomataLab home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#465447]/15 bg-[#A8B5A0] text-[#253024] transition-colors duration-200 group-hover:bg-[#465447] group-hover:text-[#F2F5EF]">
            <Workflow className="h-[19px] w-[19px]" aria-hidden="true" />
          </span>
          <span className="text-left">
            <span className="block font-serif text-[22px] font-semibold leading-none tracking-tight text-[#292D29] dark:text-[#F2F5EF]">
              AutomataLab
            </span>
            <span className="mt-1 hidden text-[9px] font-medium uppercase tracking-[0.22em] text-[#3a463b]/75 sm:block dark:text-[#C7D3C1]/70">
              Explore · Visualize · Minimize
            </span>
          </span>
        </button>

        <nav className="ml-7 hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = page === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`relative inline-flex items-center gap-1.5 py-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465447] focus-visible:ring-offset-4 focus-visible:ring-offset-[#FAFAF7] dark:focus-visible:ring-[#A8B5A0] dark:focus-visible:ring-offset-[#151a16] ${
                  active
                    ? 'text-[#292D29] dark:text-[#F2F5EF]'
                    : 'text-[#3a463b]/75 hover:text-[#292D29] dark:text-[#C7D3C1]/70 dark:hover:text-[#F2F5EF]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
                <span
                  className={`absolute inset-x-0 -bottom-[21px] h-[2px] transition-colors ${
                    active
                      ? 'bg-[#A8B5A0] dark:bg-[#A8B5A0]'
                      : 'bg-transparent'
                  }`}
                  aria-hidden="true"
                />
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden rounded-full border border-[#C7D3C1] bg-[#F2F5EF] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#3a463b]/85 lg:inline-flex dark:border-[#3a443a] dark:bg-[#202720] dark:text-[#C7D3C1]/75">
            Table-filling method
          </span>
          <ThemeToggle />
        </div>
      </div>

      <nav
        className="flex gap-1 border-t border-[#C7D3C1]/50 px-3 py-1.5 md:hidden dark:border-[#333c34]"
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
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465447] dark:focus-visible:ring-[#A8B5A0] ${
                active
                  ? 'bg-[#A8B5A0]/25 text-[#292D29] dark:bg-[#A8B5A0]/15 dark:text-[#F2F5EF]'
                  : 'text-[#3a463b]/75 hover:bg-[#F2F5EF] dark:text-[#C7D3C1]/70 dark:hover:bg-[#20261f]'
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
