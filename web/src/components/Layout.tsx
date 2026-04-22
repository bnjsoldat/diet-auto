import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChefHat,
  HelpCircle,
  History as HistoryIcon,
  ShoppingCart,
  Star,
  User,
} from 'lucide-react';
// ^ User reste importé pour la bottom bar mobile
import { ThemeToggle } from './ThemeToggle';
import { ProfileSwitcher } from './ProfileSwitcher';
import { InstallButton } from './InstallButton';
import { AuthButton } from './AuthButton';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/today', label: 'Aujourd\u2019hui', icon: CalendarDays },
  { to: '/week', label: 'Ma semaine', icon: CalendarRange },
  { to: '/shopping', label: 'Mes courses', icon: ShoppingCart },
  { to: '/recipes', label: 'Mes recettes', icon: ChefHat },
  { to: '/history', label: 'Mon suivi', icon: HistoryIcon },
  { to: '/favorites', label: 'Favoris', icon: Star },
  // « Mon profil » retiré de la nav principale : accessible via le
  // ProfileSwitcher en haut à droite (clic sur le nom du profil actif)
  // et toujours présent dans la bottom bar mobile.
  // « Intégrations » retiré aussi (accessible depuis /compte, /integrations
  // direct ou le footer).
];

/** 4 onglets principaux pour la bottom bar mobile (les autres sont dans un menu "Plus"). */
const mobileBottom = [
  { to: '/today', label: 'Jour', icon: CalendarDays },
  { to: '/week', label: 'Semaine', icon: CalendarRange },
  { to: '/shopping', label: 'Courses', icon: ShoppingCart },
  { to: '/profiles', label: 'Profil', icon: User },
];

export function Layout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-20 border-b bg-[var(--bg)]/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link
            to={isLanding ? '/' : '/today'}
            className="flex items-center gap-2 shrink-0 min-w-0"
          >
            <img
              src="/favicon.svg?v=2"
              alt=""
              className="h-8 w-8 rounded-md shrink-0"
              aria-hidden
            />
            <span className="font-semibold whitespace-nowrap">Ma Diét</span>
          </Link>

          {/* Desktop nav — visible dès md: (768px+).
              - Entre md et lg (768-1023px) : icônes seules pour fit sans scroll.
              - lg+ (1024px+) : icônes + labels complets. */}
          {!isLanding && (
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 flex-1 justify-center">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  title={n.label}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                      'px-2 py-1.5 lg:px-3',
                      isActive
                        ? 'bg-[var(--bg-subtle)] text-[var(--text)]'
                        : 'muted hover:bg-[var(--bg-subtle)] hover:text-[var(--text)]'
                    )
                  }
                >
                  <n.icon size={16} />
                  <span className="hidden lg:inline">{n.label}</span>
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {/* Sur la landing, on affiche Blog + Aide prominents (SEO +
                découverte). Sur les pages app, Aide devient une icône
                discrète (les 6 items de nav principale occupent déjà
                la place — on évite la surcharge). */}
            {isLanding ? (
              <>
                <Link
                  to="/blog"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm muted hover:text-[var(--text)] px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <BookOpen size={14} />
                  Blog
                </Link>
                <Link
                  to="/aide"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm muted hover:text-[var(--text)] px-2.5 py-1.5 rounded-md hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  <HelpCircle size={14} />
                  Aide
                </Link>
              </>
            ) : (
              <Link
                to="/aide"
                title="Aide"
                aria-label="Aide"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md muted hover:text-[var(--text)] hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <HelpCircle size={16} />
              </Link>
            )}
            <AuthButton />
            {!isLanding && <ProfileSwitcher />}
            <InstallButton />
            <ThemeToggle />
          </div>
        </div>

        {/* En <md, on affiche une barre de raccourcis horizontaux pour les
            pages secondaires (les 4 principales sont en bottom bar).
            À md+, la nav principale du header (icônes-only → labels sur lg)
            gère tout : on masque cette barre. */}
        {!isLanding && (
          <nav className="md:hidden border-t overflow-x-auto">
            <div className="flex min-w-max">
              {nav
                .filter((n) => !mobileBottom.some((b) => b.to === n.to))
                .map((n) => (
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

      <main className="flex-1 pb-20 md:pb-0">
        {/* AnimatePresence + PageTransition : anime l'entrée/sortie
            de chaque route (fade + slide 8 px). La key pathname force
            l'animation à chaque changement. */}
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>

      {/* Bottom tab bar iOS-style, mobile uniquement */}
      {!isLanding && (
        <nav className="fixed bottom-0 inset-x-0 z-30 md:hidden border-t bg-[var(--bg)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-4">
            {mobileBottom.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors',
                    isActive
                      ? 'text-emerald-600'
                      : 'muted hover:text-[var(--text)]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <n.icon
                      size={20}
                      className={cn('transition-transform', isActive && 'scale-110')}
                    />
                    <span>{n.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      <footer className="border-t py-6 text-center text-xs muted">
        <p>Ma Diét · calcule ton besoin, optimise tes quantités.</p>
        <div className="mt-2 flex justify-center gap-3 flex-wrap">
          <Link to="/blog" className="hover:text-[var(--text)]">Blog</Link>
          <span>·</span>
          <Link to="/aide" className="hover:text-[var(--text)]">Aide</Link>
          <span>·</span>
          <Link to="/integrations" className="hover:text-[var(--text)]">Intégrations</Link>
          <span>·</span>
          <Link to="/cgu" className="hover:text-[var(--text)]">CGU</Link>
          <span>·</span>
          <Link to="/confidentialite" className="hover:text-[var(--text)]">Confidentialité</Link>
          <span>·</span>
          <Link to="/mentions-legales" className="hover:text-[var(--text)]">Mentions légales</Link>
        </div>
      </footer>
    </div>
  );
}
