import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Cloud, CloudOff, Flame, LogOut, Mail, Trash2, User, Watch } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { pushAll, pullAll } from '@/lib/cloudSync';
import { isCloudEnabled } from '@/lib/supabase';
import { EmptyState } from '@/components/EmptyState';

export function Account() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const deleteAccount = useAuth((s) => s.deleteAccount);

  const [syncing, setSyncing] = useState<'idle' | 'push' | 'pull'>('idle');
  const [msg, setMsg] = useState<string | null>(null);

  if (!isCloudEnabled()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={CloudOff}
          title="Mode dev local"
          description="Supabase n'est pas configuré sur cette instance. En prod, la connexion est obligatoire pour sync multi-appareil."
          tone="slate"
          cta={
            <Link className="btn-primary" to="/today">
              Aller au plan du jour
            </Link>
          }
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <EmptyState
          icon={User}
          title="Pas encore connecté"
          description="Connecte-toi pour synchroniser tes plans, recettes et suivi sur tous tes appareils."
          cta={
            <Link className="btn-primary" to="/login">
              Se connecter
            </Link>
          }
        />
      </div>
    );
  }

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  async function handleManualPush() {
    if (!user) return;
    setSyncing('push');
    setMsg(null);
    try {
      await pushAll(user.id);
      setMsg('Données envoyées au cloud ✓');
    } catch (e) {
      setMsg('Échec de la synchronisation : ' + (e as Error).message);
    } finally {
      setSyncing('idle');
    }
  }

  async function handleManualPull() {
    if (!user) return;
    if (
      !confirm(
        'Ceci va remplacer les données de cet appareil par celles du cloud. Continuer ?'
      )
    )
      return;
    setSyncing('pull');
    setMsg(null);
    try {
      const pulled = await pullAll(user.id);
      setMsg(pulled ? 'Données récupérées du cloud ✓ (recharge la page)' : 'Le cloud est vide pour ce compte.');
    } catch (e) {
      setMsg('Échec : ' + (e as Error).message);
    } finally {
      setSyncing('idle');
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        'Supprimer ton compte et TOUTES tes données (plans, recettes, historique) ? Cette action est irréversible.'
      )
    )
      return;
    if (!confirm('Vraiment sûr ? Clique OK pour confirmer la suppression définitive.')) return;
    const { error } = await deleteAccount();
    if (error) {
      setMsg('Échec : ' + error);
      return;
    }
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Mon compte</h1>
        <p className="muted text-sm mt-1">
          Gère ta connexion et la synchronisation avec le cloud.
        </p>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 grid place-items-center shrink-0">
            <User size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs muted uppercase tracking-wider font-semibold">
              Connecté en tant que
            </div>
            <div className="font-medium truncate flex items-center gap-1.5">
              <Mail size={13} className="muted shrink-0" />
              {user.email}
            </div>
            <div className="text-xs muted mt-1">
              Compte créé le{' '}
              {user.created_at
                ? new Date(user.created_at).toLocaleDateString('fr-FR')
                : '—'}
            </div>
          </div>
          <button className="btn-outline" onClick={handleLogout}>
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Cloud size={16} className="text-emerald-600" />
          <h2 className="font-semibold">Synchronisation cloud</h2>
        </div>
        <p className="text-sm muted mb-4">
          Tes plans, recettes, suivi de poids et favoris sont automatiquement sauvegardés sur le
          cloud. Tu peux les retrouver sur n'importe quel appareil en te reconnectant avec le
          même email.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-outline"
            onClick={handleManualPush}
            disabled={syncing !== 'idle'}
          >
            {syncing === 'push' ? 'Envoi…' : 'Envoyer maintenant ↑'}
          </button>
          <button
            className="btn-outline"
            onClick={handleManualPull}
            disabled={syncing !== 'idle'}
          >
            {syncing === 'pull' ? 'Récupération…' : 'Récupérer du cloud ↓'}
          </button>
        </div>
        {msg && (
          <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">{msg}</div>
        )}
      </div>

      {/* Raccourci vers la page Intégrations (Strava, plus tard Apple/Fit/Garmin) */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-md bg-orange-50 dark:bg-orange-950/40 text-orange-600 grid place-items-center shrink-0">
            <Flame size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold flex items-center gap-2">
              Intégrations sportives
              <Watch size={13} className="muted" />
            </h2>
            <p className="text-sm muted mt-1 leading-relaxed">
              Connecte Strava (ou plus tard Garmin / Apple Santé / Google Fit) pour que tes
              kcal brûlées ajustent automatiquement ta cible journalière. Strava reçoit déjà
              les données de la plupart des montres (Garmin, Apple Watch, Polar, Coros…).
            </p>
            <div className="mt-3">
              <Link to="/integrations" className="btn-primary">
                <Watch size={14} /> Gérer mes intégrations
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 border-red-200 dark:border-red-900">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-red-600" />
          <h2 className="font-semibold text-red-600">Zone dangereuse</h2>
        </div>
        <p className="text-sm muted mb-4">
          Supprime ton compte et toutes les données associées (plans, recettes, suivi de poids,
          rappels). Les données locales sur cet appareil ne seront pas touchées — tu peux les
          supprimer manuellement depuis les paramètres du navigateur.
        </p>
        <button
          className="btn text-red-600 border border-red-300 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/30"
          onClick={handleDelete}
        >
          <Trash2 size={14} /> Supprimer mon compte
        </button>
      </div>

      <p className="text-xs muted text-center mt-8">
        <Link to="/cgu" className="underline">CGU</Link> ·{' '}
        <Link to="/confidentialite" className="underline">Politique de confidentialité</Link> ·{' '}
        <Link to="/mentions-legales" className="underline">Mentions légales</Link>
      </p>
    </div>
  );
}
