import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { Activite, Genre, Objectif, ObjectifType, Profile, Rythme, Sport } from '@/types';
import {
  ACTIVITY_COEFS,
  ACTIVITY_DESCRIPTIONS,
  RYTHME_LABELS,
  SPORT_LABELS,
} from '@/lib/constants';
import {
  calcTargets,
  checkTargetHealthWarnings,
  estimatedTargetDate,
  recommendedTargetWeight,
} from '@/lib/calculations';
import { ageFromBirthDate } from '@/lib/age';
import { cn } from '@/lib/utils';
import { InfoTip } from './InfoTip';

interface Props {
  initial?: Partial<Profile>;
  submitLabel?: string;
  onSubmit: (data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

const ACTIVITES = Object.keys(ACTIVITY_COEFS) as Activite[];
const RYTHMES: Rythme[] = [0.25, 0.5, 0.75, 1];
const SPORTS: Sport[] = ['muscu', 'endurance', 'mixte', 'aucun'];

type NumLike = number | '';

/**
 * Mappe un `Objectif` legacy vers le nouveau `ObjectifType` (3 cases)
 * pour afficher un bouton sélectionné cohérent sur les profils pré-v2.
 */
function deriveObjectifTypeFromLegacy(obj: Objectif): ObjectifType {
  if (obj.includes('Perte')) return 'perdre';
  if (obj.includes('Prise')) return 'prendre';
  return 'maintien';
}

/** Dérive un `Objectif` legacy à partir du nouveau modèle (pour rétrocompat). */
function deriveObjectifLegacy(type: ObjectifType, rythme: Rythme | null): Objectif {
  if (type === 'maintien') return 'Maintien';
  if (type === 'perdre') {
    return rythme && rythme >= 0.75 ? 'Perte de poids rapide' : 'Perte de poids';
  }
  return rythme && rythme >= 0.75 ? 'Prise de masse rapide' : 'Prise de masse';
}

export function ProfileForm({ initial, submitLabel = 'Enregistrer', onSubmit, onCancel }: Props) {
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [poids, setPoids] = useState<NumLike>(initial?.poids ?? 70);
  const [tailleCm, setTailleCm] = useState<NumLike>(
    initial?.taille ? Math.round(initial.taille * 100) : 175
  );
  const [birthDate, setBirthDate] = useState<string>(initial?.birthDate ?? '');
  const [ageFallback, setAgeFallback] = useState<NumLike>(initial?.age ?? 30);
  const [genre, setGenre] = useState<Genre>(initial?.genre ?? 'Homme');
  const [activite, setActivite] = useState<Activite>(initial?.activite ?? 'Actif');

  // Nouveau modèle objectif v2 : 3 boutons + poids cible + rythme.
  // Si le profil initial n'a pas d'objectifType, on le dérive de l'ancien Objectif.
  const [objectifType, setObjectifType] = useState<ObjectifType>(
    initial?.objectifType ?? (initial?.objectif ? deriveObjectifTypeFromLegacy(initial.objectif) : 'maintien')
  );
  const [poidsCible, setPoidsCible] = useState<NumLike>(initial?.poidsCible ?? '');
  const [rythmeSem, setRythmeSem] = useState<Rythme>(initial?.rythmeSem ?? 0.5);

  // Sport principal (Phase 2)
  const [sportPrincipal, setSportPrincipal] = useState<Sport>(initial?.sportPrincipal ?? 'mixte');

  const poidsNum = typeof poids === 'number' ? poids : 0;
  const tailleCmNum = typeof tailleCm === 'number' ? tailleCm : 0;
  const ageNum = birthDate
    ? ageFromBirthDate(birthDate)
    : typeof ageFallback === 'number'
      ? ageFallback
      : 0;
  const poidsCibleNum = typeof poidsCible === 'number' ? poidsCible : 0;

  /**
   * Quand l'utilisateur change d'objectif ou de poids, on pré-remplit le
   * poids cible de façon intelligente :
   *  - Perdre : IMC 22 (si pas déjà saisi)
   *  - Prendre : poids actuel + 5 kg (si pas déjà saisi)
   *  - Maintien : on vide (pas de cible)
   */
  useEffect(() => {
    if (objectifType === 'maintien') {
      setPoidsCible('');
      return;
    }
    // Si déjà une valeur saisie, ne pas écraser
    if (poidsCibleNum > 0) return;
    // Pré-remplir
    if (objectifType === 'perdre' && poidsNum > 30 && tailleCmNum > 100) {
      const rec = recommendedTargetWeight({
        poids: poidsNum,
        taille: tailleCmNum / 100,
      } as Profile);
      // Sécurité : la reco ne doit pas dépasser le poids actuel en mode perte
      setPoidsCible(Math.min(rec, poidsNum - 1));
    } else if (objectifType === 'prendre' && poidsNum > 30) {
      setPoidsCible(Math.round((poidsNum + 5) * 10) / 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [objectifType]);

  const previewProfile: Profile = {
    id: 'preview',
    nom,
    poids: poidsNum,
    taille: tailleCmNum / 100,
    age: ageNum,
    birthDate: birthDate || undefined,
    genre,
    activite,
    objectif: deriveObjectifLegacy(objectifType, objectifType === 'maintien' ? null : rythmeSem),
    objectifType,
    poidsCible: objectifType === 'maintien' ? undefined : poidsCibleNum || undefined,
    rythmeSem: objectifType === 'maintien' ? undefined : rythmeSem,
    sportPrincipal,
    createdAt: 0,
    updatedAt: 0,
  };

  const previewTargets =
    poidsNum > 30 && tailleCmNum > 100 && ageNum > 5 ? calcTargets(previewProfile) : null;

  const healthWarnings = useMemo(
    () => (poidsNum > 30 ? checkTargetHealthWarnings(previewProfile) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poidsNum, tailleCmNum, objectifType, poidsCibleNum, rythmeSem, genre]
  );

  const targetDate = useMemo(
    () => (objectifType !== 'maintien' ? estimatedTargetDate(previewProfile) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [poidsNum, poidsCibleNum, rythmeSem, objectifType]
  );

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
    const objectif = deriveObjectifLegacy(objectifType, objectifType === 'maintien' ? null : rythmeSem);
    onSubmit({
      nom: nom.trim(),
      poids: poidsNum,
      taille: tailleCmNum / 100,
      age: ageNum,
      birthDate: birthDate || undefined,
      genre,
      activite,
      objectif,
      objectifType,
      poidsCible: objectifType === 'maintien' ? undefined : poidsCibleNum || undefined,
      rythmeSem: objectifType === 'maintien' ? undefined : rythmeSem,
      sportPrincipal,
    });
  }

  const canSubmit =
    !!nom.trim() &&
    poidsNum > 0 &&
    tailleCmNum > 0 &&
    ageNum > 0 &&
    // Si perdre/prendre : il FAUT un poids cible cohérent (non nul, différent du poids actuel)
    (objectifType === 'maintien' || (poidsCibleNum > 0 && Math.abs(poidsCibleNum - poidsNum) >= 0.1));

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
          <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
            Date de naissance
            <InfoTip>
              Ta date de naissance sert à calculer ton âge automatiquement. Ton métabolisme
              de base est ainsi toujours à jour — pas besoin de mettre à jour le profil à
              chaque anniversaire.
            </InfoTip>
          </label>
          <input
            type="date"
            className="input"
            value={birthDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setBirthDate(e.target.value)}
          />
          {birthDate ? (
            <p className="mt-1 text-xs muted">{ageFromBirthDate(birthDate)} ans aujourd'hui</p>
          ) : (
            <div className="mt-2">
              <label className="block text-[11px] muted mb-1">
                ou juste l'âge (si tu préfères ne pas renseigner la date)
              </label>
              <input
                type="number"
                inputMode="numeric"
                className="input"
                value={ageFallback}
                min={10}
                max={100}
                onChange={(e) => setAgeFallback(parseNum(e.target.value))}
                onBlur={() => { if (ageFallback === '') setAgeFallback(0); }}
              />
            </div>
          )}
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

      {/* ================= OBJECTIF V2 : 3 boutons visuels ================= */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
          Ton objectif
          <InfoTip>
            On te demande ton intention, pas un nombre de calories. Le déficit/surplus
            est ensuite dérivé de ton poids cible et du rythme choisi (1 kg ≈ 7700 kcal).
          </InfoTip>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <ObjectifButton
            selected={objectifType === 'perdre'}
            onClick={() => setObjectifType('perdre')}
            icon={<TrendingDown size={18} />}
            label="Perdre"
            sublabel="du poids"
          />
          <ObjectifButton
            selected={objectifType === 'maintien'}
            onClick={() => setObjectifType('maintien')}
            icon={<Minus size={18} />}
            label="Maintenir"
            sublabel="mon poids"
          />
          <ObjectifButton
            selected={objectifType === 'prendre'}
            onClick={() => setObjectifType('prendre')}
            icon={<TrendingUp size={18} />}
            label="Prendre"
            sublabel="du muscle"
          />
        </div>

        {/* Champs conditionnels : poids cible + rythme. Apparaît en fade-in. */}
        {objectifType !== 'maintien' && (
          <div className="mt-4 space-y-4 animate-fade-in-up">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  Poids cible (kg)
                  <InfoTip>
                    La suggestion correspond à un IMC de 22 (milieu de la zone saine). Tu
                    peux bien sûr viser autre chose. Ton vrai objectif t'appartient.
                  </InfoTip>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input"
                  value={poidsCible}
                  min={30}
                  max={250}
                  step={0.1}
                  onChange={(e) => setPoidsCible(parseNum(e.target.value))}
                  placeholder={poidsNum ? recommendedTargetWeight({ poids: poidsNum, taille: tailleCmNum / 100 } as Profile).toString() : '70'}
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5">
                  Rythme
                  <InfoTip>
                    Nombre de kg par semaine à perdre/prendre. Plus intense = déficit
                    plus grand, mais fatigue et perte musculaire augmentent. 0.5 kg/sem
                    est le rythme recommandé par les nutritionnistes sportifs.
                  </InfoTip>
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {RYTHMES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRythmeSem(r)}
                      className={cn(
                        'h-9 rounded-md border text-xs font-medium transition-colors',
                        rythmeSem === r
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-[var(--border)] hover:bg-[var(--bg-subtle)]'
                      )}
                    >
                      {r} kg
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] muted">
                  <strong>{RYTHME_LABELS[rythmeSem].label}</strong> · {RYTHME_LABELS[rythmeSem].description}
                </p>
              </div>
            </div>

            {/* Affichage live : "Tu atteindras X kg d'ici Y" */}
            {poidsCibleNum > 0 && Math.abs(poidsCibleNum - poidsNum) >= 0.1 && targetDate && (
              <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 px-3 py-2 text-sm">
                Tu atteindras <strong>{poidsCibleNum.toFixed(1)} kg</strong> aux environs
                du{' '}
                <strong>
                  {targetDate.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>{' '}
                (
                {Math.round(
                  (Math.abs(poidsCibleNum - poidsNum) / rythmeSem) * 7 / 7
                )}{' '}
                semaines), soit environ{' '}
                <strong>
                  {objectifType === 'perdre' ? '-' : '+'}
                  {RYTHME_LABELS[rythmeSem].kcalApprox} kcal/jour
                </strong>
                .
              </div>
            )}

            {/* Warnings santé (si cible extrême ou rythme intense) */}
            {healthWarnings.length > 0 && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-3 space-y-2">
                {healthWarnings.map((w, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= SPORT PRINCIPAL (Phase 2) ================= */}
      <div>
        <label className="flex items-center gap-1.5 text-sm font-medium mb-2">
          Sport principal
          <InfoTip>
            Ajuste la <strong>répartition des macros</strong> selon ton sport dominant.
            Musculation → protéines boostées (30 %). Endurance → glucides (55 %). Mixte
            ou aucun → équilibré 25/50/25. La cible kcal ne change pas, juste les %
            P/G/L.
          </InfoTip>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SPORTS.map((s) => {
            const meta = SPORT_LABELS[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSportPrincipal(s)}
                className={cn(
                  'flex flex-col items-start gap-1 rounded-md border p-3 text-left transition-colors',
                  sportPrincipal === s
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-[var(--border)] hover:bg-[var(--bg-subtle)]'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{meta.emoji}</span>
                  <span className="font-medium text-sm">{meta.label}</span>
                </div>
                <span className="text-[11px] muted leading-tight">{meta.description}</span>
              </button>
            );
          })}
        </div>
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

/** Bouton visuel de sélection d'objectif (Perdre / Maintenir / Prendre). */
function ObjectifButton({
  selected,
  onClick,
  icon,
  label,
  sublabel,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-md border p-4 transition-colors',
        selected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
          : 'border-[var(--border)] hover:bg-[var(--bg-subtle)]'
      )}
    >
      <div className={cn('mb-1', selected ? 'text-emerald-600' : 'muted')}>{icon}</div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-[11px] muted">{sublabel}</div>
    </button>
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

