import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, History as HistoryIcon, ShoppingCart, Star, User, Utensils } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ProfileSwitcher } from './ProfileSwitcher';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/today', label: 'Aujourd\u2019hui', icon: CalendarDays },
  { to: '/shopping', label: 'Courses', icon: ShoppingCart },
  { to: '/history', label: 'Historique', icon: HistoryIcon },
  { to: '/favorites', label: 'Favoris', icon: Star },
  { to: '/profiles', label: 'Profils', icon: User },
];

export function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to={isLanding ? '/' : '/today'} className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-md bg-emerald-600 text-white grid place-items-center">
              <Utensils size={16} />
            </span>
            <span className="font-semibold">Diét Auto</span>
          </Link>

          {!isLanding && (
            <nav className="hidden md:flex items-center gap-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--bg-subtle)] text-[var(--text)]'
                        : 'muted hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                    )
                  }
                >
                  <n.icon size={16} />
                  <span>{n.label}</span>
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {!isLanding && <ProfileSwitcher />}
            <ThemeToggle />
          </div>
        </div>

        {!isLanding && (
          <nav className="md:hidden border-t overflow-x-auto">
            <div className="flex min-w-max">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    cn(
                      'flex-1 min-w-[90px] text-center px-4 py-2 text-sm font-medium',
                      isActive ? 'text-emerald-600' : 'muted'
                    )
                  }
                >
                  <n.icon size={16} className="inline mr-1" />
                  {n.label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t py-6 text-center text-xs muted">
        <p>
          Diét Auto · calcule ton besoin, optimise tes quantités · données stockées uniquement sur
          ton appareil.
        </p>
      </footer>
    </div>
  );
}
