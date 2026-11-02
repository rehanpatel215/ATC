import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/theme-context'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#C7D3C1] bg-[#FAFAF7] text-[#465447] transition-colors hover:bg-[#F2F5EF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#465447] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAF7] dark:border-[#3a443a] dark:bg-[#202720] dark:text-[#C7D3C1] dark:hover:bg-[#263026] dark:focus-visible:ring-[#A8B5A0] dark:focus-visible:ring-offset-[#151a16]"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Sun
        className={`absolute h-[17px] w-[17px] transition-all duration-300 ${
          isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
        aria-hidden="true"
      />
      <Moon
        className={`absolute h-[17px] w-[17px] transition-all duration-300 ${
          isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}
