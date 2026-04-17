import { useState } from 'react';
import type { Activite, Genre, Objectif, Profile } from '@/types';
import { ACTIVITY_COEFS, ACTIVITY_DESCRIPTIONS, OBJECTIVE_DELTA_KCAL } from '@/lib/constants';
import { calcTargets } from '@/lib/calculations';
import { InfoTip } from './InfoTip';

interface Props {
  initial?: Partial<Profile>;
  submitLabel?: string;
  onSubmit: (data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

const ACTIVITES = Object.keys(ACTIVITY_COEFS) as Activite[];
const OBJECTIFS = Object.keys(OBJECTIVE_DELTA_KCAL) as Objectif[];

type NumLike = number | '';

export function ProfileForm({ initial, submitLabel = 'Enregistrer', onSubmit, onCancel }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [poids, setPoids] = useState<NumLike>(initial?.poids ?? 70);
  const [tailleCm, setTailleCm] = useState<NumLike>(
    initial?.taille ? Math.round(initial.taille * 100) : 175
  );
  const [age, setAge] = useState<NumLike>(initial?.age ?? 30);
  const [genre, setGenre] = useState<Genre>(initial?.genre ?? 'Homme');
  const [activite, setActivite] = useState<Activite>(initial?.activite ?? 'Actif');
  const [objectif, setObjectif] = useState<Objectif>(initial?.objectif ?? 'Maintien');

  const poidsNum = typeof poids === 'number' ? poids : 0;
  const tailleCmNum = typeof tailleCm === 'number' ? tailleCm : 0;
  const ageNum = typeof age === 'number' ? age : 0;

  const previewProfile = {
    nom,
    poids: poidsNum,
    taille: tailleCmNum / 100,
    age: ageNum,
    genre,
    activite,
    objectif,
  };

  const previewTargets =
    poidsNum > 30 && tailleCmNum > 100 && ageNum > 5
      ? calcTargets(previewProfile as Profile)
      : null;

  /** Parser robuste : vide → '', sinon nombre (virgule acceptée). */
  function parseNum(raw: string): NumLike {
    const trimmed = raw.replace(',', '.').trim();
    if (trimmed === '') return '';
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    if (poidsNum <= 0 || tailleCmNum <= 0 || ageNum <= 0) return;
    onSubmit({
      nom: nom.trim(),
      poids: poidsNum,
      taille: tailleCmNum / 100,
      age: ageNum,
      genre,
      activite,
      objectif,
    });
  }

  const canSubmit = !!nom.trim() && poidsNum > 0 && tailleCmNum > 0 && ageNum > 0;

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
            inputMode="decimal"
            className="input"
            value={poids}
            min={30}
            max={250}
            step={0.1}
            onChange={(e) => setPoids(parseNum(e.target.value))}
            onBlur={() => { if (poids === '') setPoids(0); }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Taille (cm)</label>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            value={tailleCm}
            min={120}
            max={230}
            onChange={(e) => setTailleCm(parseNum(e.target.value))}
            onBlur={() => { if (tailleCm === '') setTailleCm(0); }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Âge</label>
          <input
            type="number"
            inputMode="numeric"
            className="input"
            value={age}
            min={10}
            max={100}
            onChange={(e) => setAge(parseNum(e.target.value))}
            onBlur={() => { if (age === '') setAge(0); }}
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
        <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
          Niveau d'activité
          <InfoTip>
            Multiplie ton <strong>métabolisme de base</strong> pour donner le nombre de calories
            brûlées en moyenne sur une journée. Sédentaire = × 1.2, Actif = × 1.55, Très actif
            = × 1.725, Extrêmement actif = × 1.9. Compte le travail + l'entraînement.
          </InfoTip>
        </label>
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
        <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
          Objectif
          <InfoTip>
            Applique un <strong>déficit</strong> ou un <strong>surplus</strong> calorique à ta
            maintenance. Perte = -400/-750 kcal/j (≈ 0.4 à 0.7 kg/semaine). Prise de masse = +400
            à +750 kcal/j. Maintien = 0.
          </InfoTip>
        </label>
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
            <Stat
              label="MB"
              value={`${previewTargets.mb} kcal`}
              tip={
                <>
                  <strong>Métabolisme de base</strong> : énergie consommée par ton corps au
                  repos complet (cœur, cerveau, organes) sans activité physique. Calculé par la
                  formule de Harris-Benedict selon ton âge, genre, taille et poids.
                </>
              }
            />
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
        <button type="submit" className="btn-primary" disabled={!canSubmit}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Stat({
  label,
  value,
  accent,
  tip,
}: {
  label: string;
  value: string;
  accent?: boolean;
  tip?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs muted flex items-center gap-1">
        {label}
        {tip && <InfoTip>{tip}</InfoTip>}
      </div>
      <div className={accent ? 'font-semibold text-emerald-600' : 'font-medium'}>{value}</div>
    </div>
  );
}
