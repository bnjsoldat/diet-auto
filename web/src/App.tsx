import { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ImportPlanPrompt } from './components/ImportPlanPrompt';
import { Home } from './pages/Home';
import { Setup } from './pages/Setup';
import { Today } from './pages/Today';
import { History } from './pages/History';
import { Profiles } from './pages/Profiles';
import { Favorites } from './pages/Favorites';
import { Shopping } from './pages/Shopping';
import { Recipes } from './pages/Recipes';
import { useProfile } from './store/useProfile';
import { useDayPlan } from './store/useDayPlan';
import { useFavorites } from './store/useFavorites';
import { useSettings } from './store/useSettings';
import { useWeight } from './store/useWeight';
import { useRecipes } from './store/useRecipes';
import { useCustomFoods } from './store/useCustomFoods';
import { useReminders } from './store/useReminders';
import { useReminderScheduler } from './hooks/useReminderScheduler';

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
    </>
  );
}
