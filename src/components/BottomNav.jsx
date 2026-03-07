import { NavLink } from 'react-router-dom'
import { Home, BookOpen, BarChart2, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: "Today" },
  { to: '/practice', icon: BookOpen, label: "Practice" },
  { to: '/progress', icon: BarChart2, label: "Progress" },
  { to: '/settings', icon: Settings, label: "Settings" },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-pb">
      <div className="flex max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                isActive ? 'text-[#C60B1E]' : 'text-gray-400'
              }`
            }
          >
            <Icon size={22} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
