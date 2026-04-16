import { useState } from 'react';
import type { Activite, Genre, Objectif, Profile } from '@/types';
import { ACTIVITY_COEFS, ACTIVITY_DESCRIPTIONS, OBJECTIVE_DELTA_KCAL } from '@/lib/constants';
import { calcTargets } from '@/lib/calculations';

interface Props {
  initial?: Partial<Profile>;
  submitLabel?: string;
  onSubmit: (data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

const ACTIVITES = Object.keys(ACTIVITY_COEFS) as Activite[];
const OBJECTIFS = Object.keys(OBJECTIVE_DELTA_KCAL) as Objectif[];

export function ProfileForm({ initial, submitLabel = 'Enregistrer', onSubmit, onCancel }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [poids, setPoids] = useState<number>(initial?.poids ?? 70);
  const [tailleCm, setTailleCm] = useState<number>(
    initial?.taille ? Math.round(initial.taille * 100) : 175
  );
  const [age, setAge] = useState<number>(initial?.age ?? 30);
  const [genre, setGenre] = useState<Genre>(initial?.genre ?? 'Homme');
  const [activite, setActivite] = useState<Activite>(initial?.activite ?? 'Actif');
  const [objectif, setObjectif] = useState<Objectif>(initial?.objectif ?? 'Maintien');

  const previewProfile = {
    nom,
    poids,
    taille: tailleCm / 100,
    age,
    genre,
    activite,
    objectif,
  };

  const previewTargets = poids > 30 && tailleCm > 100 && age > 5 ? calcTargets(previewProfile as Profile) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    onSubmit({
      nom: nom.trim(),
      poids,
      taille: tailleCm / 100,
      age,
      genre,
      activite,
      objectif,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div>
        <label className="block text-sm font-medium mb-1.5">Nom du profil</label>
        <input
          className="input"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="ex : Moi, Sarah, Bulk 2026…"
          required
          maxLength={40}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Poids (kg)</label>
          <input
            type="number"
            className="input"
            value={poids}
            min={30}
            max={250}
            step={0.1}
            onChange={(e) => setPoids(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Taille (cm)</label>
          <input
            type="number"
            className="input"
            value={tailleCm}
            min={120}
            max={230}
            onChange={(e) => setTailleCm(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Âge</label>
          <input
            type="number"
            className="input"
            value={age}
            min={10}
            max={100}
            onChange={(e) => setAge(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Genre</label>
          <select
            className="input"
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
          >
            <option value="Homme">Homme</option>
            <option value="Femme">Femme</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Niveau d'activité</label>
        <select
          className="input"
          value={activite}
          onChange={(e) => setActivite(e.target.value as Activite)}
        >
          {ACTIVITES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs muted">{ACTIVITY_DESCRIPTIONS[activite]}</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Objectif</label>
        <select
          className="input"
          value={objectif}
          onChange={(e) => setObjectif(e.target.value as Objectif)}
        >
          {OBJECTIFS.map((o) => (
            <option key={o} value={o}>
              {o} ({OBJECTIVE_DELTA_KCAL[o] >= 0 ? '+' : ''}
              {OBJECTIVE_DELTA_KCAL[o]} kcal/j)
            </option>
          ))}
        </select>
      </div>

      {previewTargets && (
        <div className="card p-4">
          <div className="text-xs font-medium muted uppercase tracking-wide mb-2">
            Aperçu des cibles
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
            <Stat label="MB" value={`${previewTargets.mb} kcal`} />
            <Stat label="Cible" value={`${previewTargets.kcalCible} kcal`} accent />
            <Stat label="Protéines" value={`${previewTargets.prot} g`} />
            <Stat label="Glucides" value={`${previewTargets.gluc} g`} />
            <Stat label="Lipides" value={`${previewTargets.lip} g`} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={!nom.trim()}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs muted">{label}</div>
      <div className={accent ? 'font-semibold text-emerald-600' : 'font-medium'}>{value}</div>
    </div>
  );
}
