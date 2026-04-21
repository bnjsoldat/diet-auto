import { Link } from 'react-router-dom';
import { BlogLayout, type BlogPostMeta } from '../BlogLayout';

export const meta: BlogPostMeta = {
  slug: 'reequilibrage-alimentaire-debuter',
  title: 'Rééquilibrage alimentaire : par où commencer (guide débutant)',
  description:
    "Manger mieux sans régime restrictif : la méthode progressive, les 5 premières habitudes à installer, les portions repères, et comment tenir dans la durée sans effet yo-yo.",
  publishedAt: '2026-04-23',
  readingMinutes: 8,
  keywords: [
    'rééquilibrage alimentaire',
    'manger mieux',
    'alimentation équilibrée',
    'débuter alimentation saine',
    'portion repère',
    'habitudes alimentaires',
    'nutrition débutant',
  ],
};

export default function Post() {
  return (
    <BlogLayout meta={meta}>
      <p>
        « Rééquilibrage alimentaire », c'est le mot à la mode pour dire{' '}
        <strong>manger mieux sans se priver</strong>. Contrairement à un régime (restriction
        forte et temporaire), c'est une <strong>refonte durable</strong> de ce que tu
        manges, dans quelle quantité, et à quelle fréquence. Pas de liste d'aliments
        interdits. Juste des ajustements progressifs.
      </p>
      <p>
        Ce qui suit est le <strong>kit de démarrage</strong> : les 5 premières habitudes à
        installer, les portions repères pour arrêter de tout peser, et comment éviter le
        piège du « je m'y remets lundi » qui finit chaque fois par un craquage le weekend.
      </p>

      <h2>Rééquilibrage ≠ régime : la différence fondamentale</h2>
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Régime</th>
            <th>Rééquilibrage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Durée</strong></td>
            <td>1-3 mois</td>
            <td>À vie</td>
          </tr>
          <tr>
            <td><strong>Objectif</strong></td>
            <td>Perdre X kg</td>
            <td>Bien manger + poids stable</td>
          </tr>
          <tr>
            <td><strong>Restriction</strong></td>
            <td>Forte (-500 à -800 kcal)</td>
            <td>Faible ou nulle</td>
          </tr>
          <tr>
            <td><strong>Liste noire</strong></td>
            <td>Oui (gras, sucre, pâtes…)</td>
            <td>Aucune — tout en quantité juste</td>
          </tr>
          <tr>
            <td><strong>Effet yo-yo</strong></td>
            <td>Très fréquent</td>
            <td>Rare</td>
          </tr>
        </tbody>
      </table>
      <p>
        Si tu as déjà fait un régime, tu connais la boucle : tu perds 5 kg en 2 mois, tu
        « relâches », tu reprends 6 kg en 6 mois. Le rééquilibrage casse cette boucle parce
        qu'il n'y a rien à « relâcher » — tu manges déjà comme tu vas manger le reste de ta
        vie.
      </p>

      <h2>Les 5 habitudes à installer (dans cet ordre)</h2>

      <h3>1. Mange 3 repas structurés par jour</h3>
      <p>
        Fini le grignotage toute la journée + le gros dîner à 22 h. La structure classique
        (petit-déj, déjeuner, dîner) est la meilleure base. Si tu as faim l'après-midi,
        ajoute <strong>une collation unique</strong> (pas 3) vers 16 h avec un fruit + une
        poignée d'amandes.
      </p>
      <p>
        <strong>Pourquoi ça marche</strong> : tes signaux faim/satiété se recalibrent en 3
        semaines. Tu manges mieux parce que tu arrives affamé au repas et tu savoures, au
        lieu de picorer sans faim.
      </p>

      <h3>2. La moitié de ton assiette = légumes</h3>
      <p>
        Règle mnémotechnique : regarde ton assiette. <strong>50 % de légumes</strong>{' '}
        (crus ou cuits), <strong>25 % de protéines</strong> (viande, poisson, œufs, tofu,
        légumineuses), <strong>25 % de féculents</strong> (riz, pâtes, patate, pain).
        Lipides (huile, fromage) en accompagnement.
      </p>
      <p>
        Tu n'as pas besoin de peser. Juste de regarder.
      </p>

      <h3>3. Bois de l'eau, surtout avant de manger</h3>
      <p>
        <strong>1,5 à 2 litres d'eau par jour</strong> (hors tisanes, café). Un grand verre
        20 min avant le repas réduit naturellement les quantités ingérées sans te couper
        l'appétit. Les sodas, jus industriels et alcool ajoutent 300-600 kcal par jour que
        tu ne sens pas — commence par les remplacer par de l'eau.
      </p>

      <h3>4. Lis les étiquettes (2 chiffres suffisent)</h3>
      <p>
        Regarde <strong>les kcal pour 100 g</strong> et <strong>le sucre pour 100 g</strong>.
        C'est tout. Deux repères :
      </p>
      <ul>
        <li>
          <strong>Au-delà de 15 g de sucre / 100 g</strong> → produit sucré (à consommer
          rarement). Les céréales « équilibre » du petit-déj sont souvent à 20-30 g.
        </li>
        <li>
          <strong>Au-delà de 400 kcal / 100 g</strong> → produit très calorique (à modérer).
          Biscuits, chips, charcuterie.
        </li>
      </ul>

      <h3>5. Mange lentement (20 min par repas minimum)</h3>
      <p>
        La satiété met <strong>15-20 minutes à arriver</strong> au cerveau après le début
        du repas. Si tu engloutis ton assiette en 8 min, tu dépasses ta satiété de 30 %
        avant même que ton corps te dise stop.
      </p>
      <p>
        <strong>Trucs pratiques</strong> : pose ta fourchette entre chaque bouchée, mâche
        15-20 fois, ne mange pas devant un écran (YouTube compris — tu avales sans
        mémoriser).
      </p>

      <h2>Les portions repères (sans balance)</h2>
      <p>
        Pour les 5 aliments les plus courants, voici les <strong>portions recommandées
        par repas pour un adulte moyen</strong> :
      </p>
      <table>
        <thead>
          <tr>
            <th>Aliment</th>
            <th>Portion / repas</th>
            <th>Repère visuel</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Viande / poisson</td>
            <td>100-150 g</td>
            <td>La paume de ta main</td>
          </tr>
          <tr>
            <td>Riz, pâtes, quinoa (cuit)</td>
            <td>150-200 g</td>
            <td>Le creux de ta main fermée</td>
          </tr>
          <tr>
            <td>Pain</td>
            <td>40-60 g</td>
            <td>Un tiers de baguette</td>
          </tr>
          <tr>
            <td>Fromage</td>
            <td>30 g</td>
            <td>Une boîte d'allumettes</td>
          </tr>
          <tr>
            <td>Huile</td>
            <td>10-15 g</td>
            <td>1 cuillère à soupe rase</td>
          </tr>
        </tbody>
      </table>

      <div className="callout">
        <strong>Tip pro</strong> : si tu veux ÊTRE sûr (et ne plus te poser la question),
        trace ce que tu manges pendant 2 semaines avec une app. Tu verras où tu
        sur-consommes sans t'en rendre compte. Tu ajustes, puis tu peux arrêter de tracker.
      </div>

      <h2>Les 5 erreurs à éviter</h2>
      <ol>
        <li>
          <strong>Vouloir tout changer en 1 semaine</strong>. Résultat : craquage le weekend
          et abandon au bout de 15 jours. Change UNE habitude à la fois, pendant 2
          semaines, avant d'ajouter la suivante.
        </li>
        <li>
          <strong>Bannir entièrement un aliment</strong>. Le chocolat, la pizza, les frites
          ne sont pas « interdits » — ils sont juste occasionnels. Si tu te dis « plus
          jamais de pizza », tu vas craquer dans 3 semaines et manger 4 parts d'un coup.
        </li>
        <li>
          <strong>Se peser tous les jours</strong>. Le poids varie de ±1-2 kg à cause de
          l'eau, du cycle, du sel, du transit. Pèse-toi 1 fois par semaine, à jeun, nu.
          Regarde la tendance sur 1 mois, pas la fluctuation.
        </li>
        <li>
          <strong>Sauter le petit-déj pour « faire attention »</strong>. Tu compenses au
          déjeuner + dîner et tu grignotes le soir. Sauf si tu pratiques consciemment le
          jeûne intermittent (16:8), garde tes 3 repas.
        </li>
        <li>
          <strong>Oublier les protéines</strong>. Clé de la satiété. Un repas sans protéine
          (genre sandwich beurre-confiture) te donnera faim 2 h après. Vise{' '}
          <strong>20-30 g de protéines par repas principal</strong>.
        </li>
      </ol>

      <h2>Comment tenir dans la durée</h2>
      <p>
        Le rééquilibrage alimentaire échoue souvent parce qu'il est vu comme un effort
        permanent. Or c'est le contraire : <strong>une fois installé, ça devient
        automatique</strong>. Les trois leviers pour tenir :
      </p>
      <ul>
        <li>
          <strong>Cuisine en avance (meal prep)</strong>. Le dimanche, 1 h de cuisine = 4
          repas prêts pour la semaine. Quand tu rentres du boulot épuisé, ton bon repas est
          déjà là. Pas de tentation commande Deliveroo.
        </li>
        <li>
          <strong>Tolère la triche</strong>. Un weekend à Lyon avec un pote où tu manges
          deux repas gastros ? Pas grave. Reprends lundi sans culpabilité ni « compensation
          restrictive ». Sur 30 repas, 3 qui dérapent ne cassent rien.
        </li>
        <li>
          <strong>Mesure ta progression autrement que le poids</strong>. Ta taille de
          pantalon, ton énergie à 16 h, la qualité de ton sommeil, tes performances au
          sport. Ces indicateurs bougent avant le poids, et ils te motivent à continuer.
        </li>
      </ul>

      <h2>Le rôle d'une app comme Ma Diét</h2>
      <p>
        Dans le rééquilibrage, <strong>tracker ses apports 3-4 semaines</strong> change la
        donne. Pas pour devenir obsessif, mais pour <strong>voir réellement</strong> ce
        que tu manges :
      </p>
      <ul>
        <li>
          « J'ai ~1 500 kcal / jour mais mon besoin est à 2 200 » → explique la fatigue
          l'après-midi.
        </li>
        <li>
          « Je mange 60 g de protéines alors qu'il m'en faut 100 » → explique la faim 2 h
          après les repas.
        </li>
        <li>
          « Mon petit-déj est à 800 kcal de céréales sucrées » → explique le coup de barre
          de 11 h.
        </li>
      </ul>
      <p>
        Ma Diét calcule ton besoin, propose des plans de rééquilibrage (modèles{' '}
        <em>équilibré</em> et <em>perte douce</em>), et ajuste les quantités automatiquement
        pour que tu vises juste. Tu peux tracker pendant un mois pour te calibrer, puis
        arrêter et continuer au feeling.{' '}
        <Link to="/today">Commence ton plan</Link> — gratuit, connexion en 10 s.
      </p>
      <p>
        Si tu veux approfondir :{' '}
        <Link to="/blog/besoin-calorique-journalier">
          comment calculer ton besoin calorique précisément
        </Link>{' '}
        •{' '}
        <Link to="/blog/perdre-5-kg-en-2-mois">
          le plan perte de 5 kg si ton objectif est plus précis
        </Link>
        .
      </p>
    </BlogLayout>
  );
}
