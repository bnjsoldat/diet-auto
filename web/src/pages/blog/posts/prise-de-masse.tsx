import { Link } from 'react-router-dom';
import { BlogLayout, type BlogPostMeta } from '../BlogLayout';

export const meta: BlogPostMeta = {
  slug: 'prise-de-masse-musculaire',
  title: 'Prise de masse musculaire : le guide nutrition complet',
  description:
    "Surplus calorique, protéines, timing des repas, aliments à privilégier. Plan concret pour gagner 3 à 5 kg de muscle en 3 mois sans prendre 10 kg de gras.",
  publishedAt: '2026-04-22',
  readingMinutes: 10,
  keywords: [
    'prise de masse',
    'prise de masse musculaire',
    'surplus calorique',
    'musculation nutrition',
    'gagner du muscle',
    'calories pour prendre du muscle',
    'alimentation musculation',
    'lean bulk',
  ],
};

export default function Post() {
  return (
    <BlogLayout meta={meta}>
      <p>
        Prendre du muscle sans prendre 10 kg de gras, c'est possible — mais ça demande la
        même rigueur qu'un régime de perte de poids, juste dans l'autre sens. On parle ici
        d'une <strong>prise de masse propre</strong> (« lean bulk » en anglais) : un
        surplus calorique mesuré, des protéines adaptées, et de l'entraînement en
        surcharge progressive.
      </p>
      <p>
        Objectif réaliste pour un débutant ou intermédiaire :{' '}
        <strong>0,3 à 0,5 kg par semaine</strong>, dont la moitié environ sera du muscle
        (le reste : glycogène, eau, et un peu de graisse). Sur 3 mois, ça donne{' '}
        <strong>3 à 5 kg au total</strong> avec un ratio muscle/gras très favorable.
      </p>

      <h2>Le calcul du surplus calorique</h2>
      <p>
        Comme pour la perte de poids, tout part de ton{' '}
        <Link to="/blog/besoin-calorique-journalier">besoin calorique journalier</Link> (ton
        métabolisme × coefficient d'activité). Une fois que tu connais ton besoin de
        maintenance, tu ajoutes un surplus :
      </p>
      <ul>
        <li>
          <strong>Lean bulk (recommandé)</strong> : +200 à +300 kcal/jour. Prise de masse
          lente, ~0,3 kg/semaine, ratio muscle/gras optimal.
        </li>
        <li>
          <strong>Bulk classique</strong> : +400 à +500 kcal/jour. Prise plus rapide
          (~0,5 kg/sem), mais plus de gras accumulé.
        </li>
        <li>
          <strong>Dirty bulk</strong> : +700 kcal et plus. À éviter sauf cas extrême
          (ectomorphe qui galère à prendre). Le ratio muscle/gras devient mauvais.
        </li>
      </ul>
      <p>
        Pour un homme de 70 kg, 1m79, 30 ans, actif modéré, le besoin de maintenance
        tourne autour de <strong>2 700 kcal</strong>. Un lean bulk à <strong>2 950 kcal</strong>{' '}
        /jour est un excellent point de départ.
      </p>

      <div className="callout">
        <strong>Principe clé</strong> : mieux vaut un petit surplus constant pendant 3 mois
        qu'un gros surplus 1 mois puis une relâche. Le muscle se construit
        progressivement — pas en forcing.
      </div>

      <h2>Les protéines : le nutriment qui ne se négocie pas</h2>
      <p>
        En prise de masse, les protéines sont <strong>non négociables</strong>. La cible
        classique :
      </p>
      <ul>
        <li>
          <strong>1,6 à 2,2 g/kg de poids de corps/jour</strong> pour un pratiquant
          régulier en muscu. Au-delà, les études ne montrent pas de bénéfice
          supplémentaire sur la synthèse musculaire.
        </li>
        <li>
          Pour 70 kg : <strong>112 à 154 g de protéines</strong> par jour.
        </li>
        <li>
          Réparti sur <strong>4 à 5 repas</strong> avec au moins 25-30 g de protéines à
          chacun (c'est la dose qui déclenche la synthèse musculaire).
        </li>
      </ul>

      <h3>Top 10 des sources de protéines accessibles</h3>
      <table>
        <thead>
          <tr>
            <th>Aliment</th>
            <th>Protéines / 100 g</th>
            <th>Kcal / 100 g</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Blanc de poulet cuit</td>
            <td>31 g</td>
            <td>165</td>
          </tr>
          <tr>
            <td>Thon en boîte (nature)</td>
            <td>27 g</td>
            <td>116</td>
          </tr>
          <tr>
            <td>Bœuf haché 5 %</td>
            <td>21 g</td>
            <td>129</td>
          </tr>
          <tr>
            <td>Œufs entiers</td>
            <td>13 g</td>
            <td>145</td>
          </tr>
          <tr>
            <td>Fromage blanc 0 %</td>
            <td>8 g</td>
            <td>45</td>
          </tr>
          <tr>
            <td>Lentilles cuites</td>
            <td>9 g</td>
            <td>115</td>
          </tr>
          <tr>
            <td>Tofu ferme</td>
            <td>12 g</td>
            <td>120</td>
          </tr>
          <tr>
            <td>Whey (1 dose de 30 g)</td>
            <td>24 g</td>
            <td>120</td>
          </tr>
          <tr>
            <td>Saumon cuit</td>
            <td>22 g</td>
            <td>182</td>
          </tr>
          <tr>
            <td>Skyr</td>
            <td>11 g</td>
            <td>60</td>
          </tr>
        </tbody>
      </table>

      <h2>Les glucides : le carburant de la performance</h2>
      <p>
        En prise de masse, tu peux (et dois) manger plus de glucides que lors d'un
        régime. Ils alimentent tes séances et favorisent la récupération. Cible :
      </p>
      <ul>
        <li>
          <strong>4 à 6 g/kg de poids de corps/jour</strong> pour un pratiquant en muscu
          régulier.
        </li>
        <li>Pour 70 kg : <strong>280 à 420 g de glucides</strong> par jour.</li>
        <li>
          Privilégie les <strong>glucides complexes</strong> (riz, patate douce, avoine,
          quinoa, pain complet) sur les sucres rapides — sauf <strong>autour de
          l'entraînement</strong> où les rapides sont bienvenus.
        </li>
      </ul>

      <h2>Les lipides : ne pas les négliger</h2>
      <p>
        Erreur classique : descendre trop bas sur les lipides pour « laisser de la place »
        aux glucides. Or, les lipides sont essentiels à la production hormonale
        (testostérone notamment). Cible : <strong>0,8 à 1 g/kg/jour</strong>, soit environ{' '}
        <strong>60-80 g pour 70 kg</strong>.
      </p>
      <ul>
        <li>
          <strong>À privilégier</strong> : huile d'olive, avocat, noix/amandes, œufs
          entiers, poissons gras (saumon, sardines, maquereau).
        </li>
        <li>
          <strong>À modérer</strong> : beurre, fromages très gras, viandes rouges grasses.
        </li>
      </ul>

      <h2>Répartition type : exemple de journée à 2 950 kcal</h2>
      <p>
        Profil : homme 70 kg, lean bulk, 4-5 séances de muscu/semaine. Cibles :{' '}
        <strong>140 g protéines / 370 g glucides / 75 g lipides</strong>.
      </p>
      <table>
        <thead>
          <tr>
            <th>Repas</th>
            <th>Exemple</th>
            <th>Kcal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Petit-déj'</td>
            <td>80 g d'avoine + 250 ml lait demi-écrémé + 1 banane + 1 dose whey</td>
            <td>~650</td>
          </tr>
          <tr>
            <td>Collation matin</td>
            <td>200 g fromage blanc 0 % + 40 g flocons + miel + amandes</td>
            <td>~400</td>
          </tr>
          <tr>
            <td>Déjeuner</td>
            <td>150 g riz cru + 180 g poulet + légumes + 15 g huile olive</td>
            <td>~800</td>
          </tr>
          <tr>
            <td>Pré/post-training</td>
            <td>1 dose whey + 1 banane + 30 g flocons</td>
            <td>~400</td>
          </tr>
          <tr>
            <td>Dîner</td>
            <td>200 g saumon + 300 g patate douce + légumes verts</td>
            <td>~700</td>
          </tr>
        </tbody>
      </table>
      <p>
        <em>Total : ~2 950 kcal, P 140 g / G 370 g / L 75 g.</em>
      </p>

      <h2>Timing : faut-il manger toutes les 2h ?</h2>
      <p>
        <strong>Non</strong>. L'idée du repas « toutes les 2 heures pour stimuler la
        synthèse musculaire » est un mythe des années 2000. Ce qui compte :
      </p>
      <ul>
        <li>
          <strong>Répartir les protéines sur 4-5 prises</strong> (toutes les 3-4 h) pour
          maintenir un flux constant d'acides aminés.
        </li>
        <li>
          <strong>Avoir des glucides avant la séance</strong> (1-2 h avant) pour les
          performances.
        </li>
        <li>
          <strong>Avoir protéines + glucides dans les 2 h post-séance</strong> — la
          fameuse « fenêtre anabolique ». Elle n'est pas aussi étroite qu'on le disait
          mais elle existe.
        </li>
      </ul>

      <h2>Les 5 erreurs qui sabotent une prise de masse</h2>
      <ol>
        <li>
          <strong>Dirty bulk = gras assuré</strong>. Manger des pizzas et fast-food pour
          atteindre ses calories te fera prendre du gras inutilement. Privilégie des
          aliments denses mais de qualité (avoine, riz, viandes maigres, œufs, fruits
          secs).
        </li>
        <li>
          <strong>Pas assez de protéines</strong>. En-dessous de 1,6 g/kg, tu limites la
          synthèse musculaire même si tu manges en surplus. Vérifie tes apports avec une
          app comme Ma Diét.
        </li>
        <li>
          <strong>Pas assez manger le week-end</strong>. Erreur classique : 5 jours à
          2 900 kcal, 2 jours à 2 200 kcal car tu oublies de tracker = moyenne hebdo
          insuffisante. Garde le cap 7 jours sur 7.
        </li>
        <li>
          <strong>Ignorer l'entraînement</strong>. Un surplus calorique sans muscu = prise
          de gras, point. La nutrition sans le signal hormonal de la surcharge
          progressive ne fait rien grossir de muscle.
        </li>
        <li>
          <strong>Arrêter trop tôt</strong>. La prise de masse, c'est 3 mois minimum. En
          6 semaines, tu commences juste à sentir les effets.
        </li>
      </ol>

      <h2>Et après ? Sèche ou maintien ?</h2>
      <p>
        Une fois tes 3-5 kg atteints, deux options :
      </p>
      <ul>
        <li>
          <strong>Maintien</strong> (2-4 semaines) : repasse à ton besoin de maintenance.
          Ça laisse à ton corps le temps d'assimiler les gains, de stabiliser le poids,
          et de te remettre dans un rythme avant une éventuelle sèche.
        </li>
        <li>
          <strong>Sèche (cut)</strong> : déficit de 400-500 kcal/jour pendant 6-8
          semaines pour perdre le gras accumulé en gardant le muscle. On garde les
          protéines hautes (2,2 g/kg) et on coupe surtout les glucides/lipides.
        </li>
      </ul>

      <h2>Pourquoi Ma Diét aide en prise de masse</h2>
      <p>
        Tracker une prise de masse à la main est vite fastidieux : il faut{' '}
        <strong>hit les calories tous les jours</strong>, garder les protéines stables,
        équilibrer glucides et lipides. L'optimiseur de Ma Diét ajuste automatiquement
        les quantités pour qu'elles collent à tes cibles :
      </p>
      <ul>
        <li>Tu choisis les aliments que tu veux manger (poulet, riz, fromage blanc…).</li>
        <li>L'algo trouve les bonnes quantités pour tomber pile sur 2 950 kcal et 140 g de protéines.</li>
        <li>Tu peux verrouiller certains aliments (ex. : « je veux exactement 150 g de riz ») — l'optimiseur ajuste le reste.</li>
      </ul>
      <p>
        Plus besoin de passer 20 min à ajuster les portions au gramme près.{' '}
        <Link to="/today">Commence ton plan</Link> — gratuit, connexion en 10 s.
      </p>
    </BlogLayout>
  );
}
