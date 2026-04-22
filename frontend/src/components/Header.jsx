import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: '타임머신', icon: '🕰️' },
  { to: '/calendar', label: '캘린더', icon: '📅' },
  { to: '/quote', label: '시세', icon: '🔍' },
]

export default function Header() {
  return (
    <header className="bg-white/80 border-b border-slate-200 sticky top-0 z-20 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          <span className="text-xl font-bold text-slate-900">Stockpit</span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
