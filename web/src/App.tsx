import { lazy, Suspense, useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ImportPlanPrompt } from './components/ImportPlanPrompt';
import { CommandPalette } from './components/CommandPalette';
import { emit } from './lib/eventBus';
import { Home } from './pages/Home';
import { useProfile } from './store/useProfile';
import { useDayPlan } from './store/useDayPlan';
import { useFavorites } from './store/useFavorites';
import { useSettings } from './store/useSettings';
import { useWeight } from './store/useWeight';
import { useRecipes } from './store/useRecipes';
import { useCustomFoods } from './store/useCustomFoods';
import { useReminders } from './store/useReminders';
import { useCustomTemplates } from './store/useCustomTemplates';
import { useReminderScheduler } from './hooks/useReminderScheduler';

// Pages chargées à la demande : réduit le bundle initial de ~60 %.
// Home reste en import statique (c'est la landing, donc toujours utile tôt).
const Setup = lazy(() => import('./pages/Setup').then((m) => ({ default: m.Setup })));
const Today = lazy(() => import('./pages/Today').then((m) => ({ default: m.Today })));
const Week = lazy(() => import('./pages/Week').then((m) => ({ default: m.Week })));
const History = lazy(() => import('./pages/History').then((m) => ({ default: m.History })));
const Profiles = lazy(() => import('./pages/Profiles').then((m) => ({ default: m.Profiles })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const Shopping = lazy(() => import('./pages/Shopping').then((m) => ({ default: m.Shopping })));
const Recipes = lazy(() => import('./pages/Recipes').then((m) => ({ default: m.Recipes })));

/**
 * Skeleton affiché pendant le chargement d'une route lazy. Utilise les
 * classes .skeleton / .animate-fade-in-up définies dans index.css.
 * Plus élégant qu'un simple "Chargement…" et donne à l'utilisateur une
 * idée de la structure qui arrive.
 */
function RouteFallback() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 animate-fade-in-up">
      <div className="skeleton h-8 w-48 mb-3" />
      <div className="skeleton h-4 w-64 mb-6" />
      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid gap-4">
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
        <div className="hidden lg:block">
          <div className="skeleton h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const loadProfiles = useProfile((s) => s.load);
  const loadSettings = useSettings((s) => s.load);
  const activeId = useProfile((s) => s.activeId);
  const loadDayPlan = useDayPlan((s) => s.load);
  const loadFavs = useFavorites((s) => s.load);
  const loadWeights = useWeight((s) => s.load);
  const loadRecipes = useRecipes((s) => s.load);
  const loadCustomFoods = useCustomFoods((s) => s.load);
  const loadReminders = useReminders((s) => s.load);
  const loadCustomTemplates = useCustomTemplates((s) => s.load);

  useReminderScheduler();

  // Command palette (Cmd/Ctrl+K) — raccourci global qui fonctionne sur
  // toutes les pages.
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
        return;
      }
      // "/" focus la recherche d'aliment de la page courante (si pas dans un input)
      if (e.key === '/' && !inField) {
        const input = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Ajouter un aliment"], input[placeholder*="aliment"]'
        );
        if (input) {
          e.preventDefault();
          input.focus();
          input.select();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    loadProfiles();
    loadSettings();
    loadCustomFoods();
    loadReminders();
    loadCustomTemplates();
  }, [loadProfiles, loadSettings, loadCustomFoods, loadReminders, loadCustomTemplates]);

  useEffect(() => {
    if (activeId) {
      loadDayPlan(activeId);
      loadFavs(activeId);
      loadWeights(activeId);
      loadRecipes(activeId);
    }
  }, [activeId, loadDayPlan, loadFavs, loadWeights, loadRecipes]);

  return (
    <>
      <ImportPlanPrompt />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onOptimize={() => emit('optimize:run')}
      />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/today" element={<Today />} />
            <Route path="/week" element={<Week />} />
            <Route path="/history" element={<History />} />
            <Route path="/profiles" element={<Profiles />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/recipes" element={<Recipes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
