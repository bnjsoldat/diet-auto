import { Link } from 'react-router-dom';
import { BlogLayout, type BlogPostMeta } from '../BlogLayout';

export const meta: BlogPostMeta = {
  slug: 'besoin-calorique-journalier',
  title: 'Besoin calorique journalier : comment calculer le tien précisément',
  description:
    'Formules Harris-Benedict, coefficients d\u2019activité, ajustement selon ton objectif. Tout pour obtenir ton besoin calorique quotidien avec un vrai chiffre, pas une estimation au hasard.',
  publishedAt: '2026-04-21',
  readingMinutes: 7,
  keywords: [
    'besoin calorique journalier',
    'calcul calories par jour',
    'métabolisme de base',
    'Harris-Benedict',
    'TDEE',
    'perte de poids',
    'prise de masse',
  ],
};

export default function Post() {
  return (
    <BlogLayout meta={meta}>
      <p>
        Si tu veux <strong>perdre du poids</strong>, <strong>prendre du muscle</strong> ou
        simplement <strong>stabiliser</strong> ton poids, il te faut un point de départ chiffré :
        combien de calories ton corps consomme dans une journée. Sans ce chiffre, tous les
        conseils « mange équilibré » restent vagues.
      </p>
      <p>
        Bonne nouvelle : ce calcul tient en 3 étapes et deux formules simples. On va les
        dérouler avec un exemple concret.
      </p>

      <h2>Étape 1 — Calcule ton métabolisme de base (MB)</h2>
      <p>
        Le <strong>métabolisme de base</strong> correspond à l'énergie dont ton corps a besoin
        <em> au repos complet</em> : cœur qui bat, cerveau qui tourne, organes qui fonctionnent,
        sans aucune activité physique. C'est la base incompressible de tes dépenses.
      </p>
      <p>
        La formule la plus utilisée s'appelle <strong>Harris-Benedict</strong> (version révisée).
        Elle dépend de ton genre, ton poids, ta taille et ton âge :
      </p>
      <div className="callout">
        <strong>Homme :</strong> MB = 13,75 × poids(kg) + 500,3 × taille(m) − 6,76 × âge + 66,47
        <br />
        <strong>Femme :</strong> MB = 9,56 × poids(kg) + 184,96 × taille(m) − 4,68 × âge + 665,1
      </div>
      <p>
        <strong>Exemple :</strong> une femme de 30 ans, 65 kg, 1,65 m →
        9,56 × 65 + 184,96 × 1,65 − 4,68 × 30 + 665,1 ≈ <strong>1 450 kcal/jour</strong> au repos.
      </p>

      <h2>Étape 2 — Multiplie par ton coefficient d'activité</h2>
      <p>
        Personne ne reste immobile toute la journée. Ton vrai besoin quotidien est ton MB
        multiplié par un <strong>coefficient d'activité</strong> (appelé PAL, Physical Activity
        Level) qui reflète ton mode de vie global :
      </p>
      <table>
        <thead>
          <tr>
            <th>Niveau</th>
            <th>Coefficient</th>
            <th>Profil type</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sédentaire</td>
            <td>× 1,2</td>
            <td>Bureau, peu ou pas de sport</td>
          </tr>
          <tr>
            <td>Légèrement actif</td>
            <td>× 1,375</td>
            <td>Sport léger 1-3×/semaine</td>
          </tr>
          <tr>
            <td>Actif</td>
            <td>× 1,55</td>
            <td>Sport modéré 3-5×/semaine</td>
          </tr>
          <tr>
            <td>Très actif</td>
            <td>× 1,725</td>
            <td>Sport intense 6-7×/semaine</td>
          </tr>
          <tr>
            <td>Extrêmement actif</td>
            <td>× 1,9</td>
            <td>Athlète ou travail physique + sport quotidien</td>
          </tr>
        </tbody>
      </table>
      <p>
        Reprenons notre femme de 30 ans. Si elle est <strong>légèrement active</strong> (yoga
        2×/semaine, marche quotidienne) : 1 450 × 1,375 ≈{' '}
        <strong>1 995 kcal/jour</strong>. C'est son <strong>besoin de maintenance</strong> —
        manger ça chaque jour maintient son poids stable.
      </p>

      <h2>Étape 3 — Ajuste selon ton objectif</h2>
      <p>À partir de la maintenance, on ajoute ou retire un delta selon l'objectif :</p>
      <ul>
        <li>
          <strong>Perte de poids modérée</strong> : −400 kcal/jour → environ 0,4 kg/semaine en
          déficit sain
        </li>
        <li>
          <strong>Perte de poids rapide</strong> : −750 kcal/jour → environ 0,7 kg/semaine,
          mais plus dur à tenir longtemps
        </li>
        <li>
          <strong>Maintien</strong> : pas de delta
        </li>
        <li>
          <strong>Prise de masse</strong> : +400 kcal/jour → environ 250 g/semaine de gain,
          idéal pour prise de muscle avec peu de gras
        </li>
        <li>
          <strong>Prise rapide</strong> : +750 kcal/jour → croissance rapide mais plus de gras
        </li>
      </ul>
      <p>
        Notre femme qui veut perdre 0,4 kg/semaine cible donc{' '}
        <strong>1 995 − 400 = 1 595 kcal/jour</strong>.
      </p>
      <div className="callout">
        <strong>Pourquoi ces chiffres ?</strong> 1 kg de graisse ≈ 7 700 kcal stockées. Un
        déficit de 400 kcal × 7 jours = 2 800 kcal = ~0,36 kg perdus par semaine. Ça tient la
        route physiologiquement, sans effet yo-yo.
      </div>

      <h2>La répartition des macros (P / G / L)</h2>
      <p>
        Une fois la cible calorique posée, il faut répartir entre{' '}
        <strong>protéines, glucides et lipides</strong>. La répartition classique équilibrée :
      </p>
      <ul>
        <li>
          <strong>25 % de protéines</strong> (4 kcal/g → 1,6 g/kg de poids pour un sédentaire,
          jusqu'à 2 g/kg pour un sportif)
        </li>
        <li>
          <strong>50 % de glucides</strong> (4 kcal/g, source principale d'énergie)
        </li>
        <li>
          <strong>25 % de lipides</strong> (9 kcal/g, minimum 0,8 g/kg pour les hormones)
        </li>
      </ul>
      <p>
        Pour notre exemple à 1 595 kcal :{' '}
        <strong>
          ~100 g de protéines, ~200 g de glucides, ~44 g de lipides
        </strong>
        .
      </p>

      <h2>Les 4 erreurs courantes</h2>
      <h3>1. Se fier aux applis qui donnent un chiffre magique</h3>
      <p>
        Beaucoup d'applis proposent un chiffre rond sans expliquer la formule. Tu n'as aucun
        moyen de vérifier si c'est cohérent avec ton profil. Mieux vaut comprendre les 3
        étapes ci-dessus — tu peux toujours refaire le calcul si quelque chose change (sport,
        âge, poids).
      </p>
      <h3>2. Surestimer son niveau d'activité</h3>
      <p>
        Erreur classique : « je suis actif, je vais au sport 3×/semaine ». Mais passer 9 h
        assis au bureau + 1 h de sport = pas « actif » au sens PAL. Sois honnête. Si ton job
        est sédentaire, commence en « Légèrement actif » au maximum.
      </p>
      <h3>3. Tomber sous 1 200 kcal pour une femme, 1 500 pour un homme</h3>
      <p>
        En dessous de ces seuils, le corps entre en mode économie : ralentissement du
        métabolisme, perte musculaire, fatigue, carences. Un déficit plus doux + un peu de
        sport donne des résultats bien meilleurs sur la durée.
      </p>
      <h3>4. Ne pas ajuster en cours de route</h3>
      <p>
        Quand tu perds 5 kg, ton MB baisse (moins de masse à entretenir). Ton besoin de
        maintenance baisse aussi. Il faut recalculer tous les 1-2 mois si la perte stagne.
      </p>

      <h2>Ça donne quoi en vrai ?</h2>
      <p>
        Voici quelques exemples pour te situer (valeurs <em>maintenance</em>, sans déficit
        ni surplus) :
      </p>
      <table>
        <thead>
          <tr>
            <th>Profil</th>
            <th>Maintenance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Femme 30 ans, 60 kg, 1,65 m, sédentaire</td>
            <td>~1 700 kcal</td>
          </tr>
          <tr>
            <td>Femme 30 ans, 60 kg, 1,65 m, active</td>
            <td>~2 000 kcal</td>
          </tr>
          <tr>
            <td>Homme 30 ans, 75 kg, 1,78 m, sédentaire</td>
            <td>~2 100 kcal</td>
          </tr>
          <tr>
            <td>Homme 30 ans, 75 kg, 1,78 m, actif</td>
            <td>~2 700 kcal</td>
          </tr>
          <tr>
            <td>Homme 30 ans, 80 kg, 1,82 m, très actif</td>
            <td>~3 100 kcal</td>
          </tr>
        </tbody>
      </table>

      <h2>La méthode la plus simple : laisser l'app calculer</h2>
      <p>
        Les trois étapes sont implémentées dans <Link to="/">Ma Diét</Link> :
        renseigne une fois ton profil (poids, taille, date de naissance, niveau d'activité,
        objectif) et tu obtiens directement ta cible calorique + ta répartition macros. La
        date de naissance permet à ton âge de se mettre à jour tout seul chaque année, sans
        que tu aies à repenser au profil.
      </p>
      <p>
        Ensuite c'est à toi de composer tes repas. L'optimiseur ajuste les quantités de
        chaque aliment pour que tu arrives précisément à ta cible — c'est là que l'app prend
        tout son intérêt : tu n'as pas à faire les calculs de portions à la main.
      </p>

      <h2>À retenir</h2>
      <ul>
        <li>
          Ton besoin calorique = MB (Harris-Benedict) × coefficient d'activité ± delta objectif.
        </li>
        <li>Le MB fait 60-75 % de tes dépenses totales, l'activité fait le reste.</li>
        <li>
          Pour perdre du poids, vise un déficit de 400-500 kcal/jour sur la durée — pas 1 000.
        </li>
        <li>
          Recalcule tous les 1-2 mois si ton poids change significativement ou si ton rythme
          d'activité évolue.
        </li>
        <li>
          La répartition 25/50/25 en P/G/L est un bon point de départ pour la plupart des
          profils. Les sportifs en prise de muscle peuvent monter les protéines à 30 %.
        </li>
      </ul>
    </BlogLayout>
  );
}
