import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutGrid, LogOut, Car, Workflow } from 'lucide-react'
import { useAdminAuthStore } from '../../store/adminAuthStore'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { ThemeToggle } from '../ui/ThemeToggle'

const NAV = [
  { to: '/admin/banks',              label: 'Grid Management',    icon: LayoutGrid },
  { to: '/admin/integration-mapper', label: 'Integration Mapper', icon: Workflow   },
]

export function AdminLayout() {
  const { logout } = useAdminAuthStore()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r border-border flex flex-col shadow-sm">
        {/* Brand */}
        <div className="px-4 py-5 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-md">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">Maruti Finance</p>
            <p className="text-xs text-muted-foreground leading-tight">Admin Console</p>
          </div>
        </div>

        <Separator />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : '')} />
                  {label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <Separator />

        {/* Footer actions */}
        <div className="p-3 flex items-center justify-between gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground flex-1 justify-start"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Content area */}
      <main className="flex-1 overflow-auto bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
