import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, Trash2, UserPen } from 'lucide-react';
import { useProfile } from '@/store/useProfile';
import { ProfileForm } from '@/components/ProfileForm';
import { RemindersCard } from '@/components/RemindersCard';
import { OptimizerSettingsCard } from '@/components/OptimizerSettingsCard';
import { calcTargets } from '@/lib/calculations';
import type { Profile } from '@/types';

export function Profiles() {
  const navigate = useNavigate();
  const profiles = useProfile((s) => s.profiles);
  const activeId = useProfile((s) => s.activeId);
  const setActive = useProfile((s) => s.setActive);
  const updateProfile = useProfile((s) => s.updateProfile);
  const deleteProfile = useProfile((s) => s.deleteProfile);
  const createProfile = useProfile((s) => s.createProfile);

  const [editing, setEditing] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleDelete(p: Profile) {
    if (
      !confirm(
        `Supprimer le profil « ${p.nom} » ? Tous ses plans et favoris seront aussi supprimés.`
      )
    )
      return;
    await deleteProfile(p.id);
    if (profiles.length === 1) navigate('/');
  }

  if (creating) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Nouveau profil</h1>
        <ProfileForm
          submitLabel="Créer"
          onSubmit={async (d) => {
            await createProfile(d);
            setCreating(false);
          }}
          onCancel={() => setCreating(false)}
        />
      </div>
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold mb-6">Modifier {editing.nom}</h1>
        <ProfileForm
          initial={editing}
          submitLabel="Enregistrer"
          onSubmit={async (d) => {
            await updateProfile(editing.id, d);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Profils</h1>
          <p className="muted mt-1">Gère tous les profils enregistrés sur cet appareil.</p>
        </div>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={14} /> Nouveau profil
        </button>
      </div>

      <div className="mb-4">
        <RemindersCard />
      </div>
      <div className="mb-6">
        <OptimizerSettingsCard />
      </div>

      <div className="grid gap-3">
        {profiles.map((p) => {
          const t = calcTargets(p);
          const isActive = p.id === activeId;
          return (
            <div
              key={p.id}
              className="card p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{p.nom}</h3>
                  {isActive && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 rounded px-1.5 py-0.5">
                      <Check size={10} /> Actif
                    </span>
                  )}
                </div>
                <div className="text-sm muted mt-0.5">
                  {p.poids} kg · {Math.round(p.taille * 100)} cm · {p.age} ans · {p.genre}
                </div>
                <div className="text-xs muted">
                  {p.activite} · {p.objectif} → {t.kcalCible} kcal/j
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isActive && (
                  <button className="btn-outline h-8 px-3 text-xs" onClick={() => setActive(p.id)}>
                    Activer
                  </button>
                )}
                <button className="btn-ghost h-8 px-3 text-xs" onClick={() => setEditing(p)}>
                  <UserPen size={12} /> Modifier
                </button>
                <button
                  className="btn-danger h-8 px-3 text-xs"
                  onClick={() => handleDelete(p)}
                  disabled={profiles.length === 1}
                  title={profiles.length === 1 ? 'Impossible de supprimer le dernier profil' : ''}
                >
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
