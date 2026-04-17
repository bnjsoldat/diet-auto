import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ImportPlanPrompt } from './components/ImportPlanPrompt';
import { Home } from './pages/Home';
import { useProfile } from './store/useProfile';
import { useDayPlan } from './store/useDayPlan';
import { useFavorites } from './store/useFavorites';
import { useSettings } from './store/useSettings';
import { useWeight } from './store/useWeight';
import { useRecipes } from './store/useRecipes';
import { useCustomFoods } from './store/useCustomFoods';
import { useReminders } from './store/useReminders';
import { useReminderScheduler } from './hooks/useReminderScheduler';

// Pages chargées à la demande : réduit le bundle initial de ~60 %.
// Home reste en import statique (c'est la landing, donc toujours utile tôt).
const Setup = lazy(() => import('./pages/Setup').then((m) => ({ default: m.Setup })));
const Today = lazy(() => import('./pages/Today').then((m) => ({ default: m.Today })));
const History = lazy(() => import('./pages/History').then((m) => ({ default: m.History })));
const Profiles = lazy(() => import('./pages/Profiles').then((m) => ({ default: m.Profiles })));
const Favorites = lazy(() => import('./pages/Favorites').then((m) => ({ default: m.Favorites })));
const Shopping = lazy(() => import('./pages/Shopping').then((m) => ({ default: m.Shopping })));
const Recipes = lazy(() => import('./pages/Recipes').then((m) => ({ default: m.Recipes })));

function RouteFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-20 text-center muted">Chargement…</div>
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

  useReminderScheduler();

  useEffect(() => {
    loadProfiles();
    loadSettings();
    loadCustomFoods();
    loadReminders();
  }, [loadProfiles, loadSettings, loadCustomFoods, loadReminders]);

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
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/today" element={<Today />} />
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
