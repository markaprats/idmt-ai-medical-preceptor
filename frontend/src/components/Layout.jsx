import { Outlet, NavLink } from 'react-router-dom'
import { FileText, Clipboard, Brain, Shield, AlertTriangle } from 'lucide-react'

export default function Layout() {
  const navItems = [
    { path: '/case', icon: Clipboard, label: 'Case Input' },
    { path: '/results', icon: Brain, label: 'Results' },
    { path: '/upload', icon: FileText, label: 'Admin Docs' },

  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="font-semibold text-lg">IDMT AI Medical Preceptor</span>
        </div>
        <span className="text-xs text-slate-400">Prototype v1.0</span>
      </header>

      {/* Persistent Warning Banner */}
      <div className="bg-yellow-50 border-b border-yellow-300 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm text-yellow-800">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">
            Prototype only. Not for clinical use. Verify all information. Do not enter PII/PHI.
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map(({ path, icon: Icon, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-red-600 text-red-700'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 px-4 py-3 text-center">
        <p className="text-xs text-slate-500">
          © 2026 Mark Prats. Prototype for evaluation purposes. Not an official U.S. Air Force or Department of Defense system.
        </p>
      </footer>
    </div>
  )
}