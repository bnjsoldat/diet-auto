import { Link } from 'react-router-dom';
import { BlogLayout, type BlogPostMeta } from '../BlogLayout';

export const meta: BlogPostMeta = {
  slug: 'macros-musculation-guide',
  title: 'Macros en musculation : le guide pratique (protéines, glucides, lipides)',
  description:
    "Comment calculer tes macros pour la muscu : formule exacte, répartition autour de l'entraînement, erreurs classiques. Pour sèche, prise ou maintien.",
  publishedAt: '2026-04-24',
  readingMinutes: 9,
  keywords: [
    'macros musculation',
    'calcul macros muscu',
    'protéines musculation',
    'glucides musculation',
    'répartition macros',
    'timing macros',
    'macros sèche',
    'macros prise de masse',
  ],
};

export default function Post() {
  return (
    <BlogLayout meta={meta}>
      <p>
        En musculation, <strong>la répartition des macros compte presque autant que le total
        calorique</strong>. Tu peux manger 2 500 kcal et prendre du muscle OU te casser la
        gueule selon ce que tu mets dedans. Ce guide te donne les chiffres exacts, la
        répartition autour des séances, et les erreurs qui sabotent 80 % des pratiquants.
      </p>

      <h2>Les 3 macros : rôle et cible</h2>
      <p>
        Un macronutriment (macro) est un nutriment apportant des calories. Il y en a 3 :
        <strong> protéines, glucides, lipides</strong>. Chacun a un rôle précis.
      </p>
      <table>
        <thead>
          <tr>
            <th>Macro</th>
            <th>Rôle muscu</th>
            <th>Cible (/kg de poids)</th>
            <th>kcal/g</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Protéines</strong></td>
            <td>Construction musculaire, satiété</td>
            <td>1,6 à 2,2 g/kg</td>
            <td>4</td>
          </tr>
          <tr>
            <td><strong>Glucides</strong></td>
            <td>Énergie séance, récupération</td>
            <td>3 à 6 g/kg</td>
            <td>4</td>
          </tr>
          <tr>
            <td><strong>Lipides</strong></td>
            <td>Hormones, vitamines liposolubles</td>
            <td>0,8 à 1,2 g/kg</td>
            <td>9</td>
          </tr>
        </tbody>
      </table>

      <h2>Calcul concret pour un profil type</h2>
      <p>
        <strong>Homme 75 kg, musculation 4x/sem, objectif maintien</strong> à 2 900 kcal/jour :
      </p>
      <ul>
        <li>
          <strong>Protéines</strong> : 2 g/kg × 75 = <strong>150 g</strong> →{' '}
          <em>600 kcal (21 %)</em>
        </li>
        <li>
          <strong>Lipides</strong> : 1 g/kg × 75 = <strong>75 g</strong> →{' '}
          <em>675 kcal (23 %)</em>
        </li>
        <li>
          <strong>Glucides</strong> : reste = 2 900 − 600 − 675 = <strong>406 g</strong> →{' '}
          <em>1 625 kcal (56 %)</em>
        </li>
      </ul>
      <p>
        Répartition classique : <strong>20 % P / 55 % G / 25 % L</strong>. Si tu es plus sur
        une sèche, tu montes les protéines à 2,2 g/kg et tu coupes les glucides. Si tu es en
        prise de masse, tu montes les glucides à 5-6 g/kg.
      </p>

      <div className="callout">
        <strong>Règle d'or</strong> : fixe les protéines et les lipides en premier (non
        négociables), les glucides prennent ce qui reste. C'est la méthode la plus flexible.
      </div>

      <h2>Le timing : quand manger quoi ?</h2>
      <p>
        Le timing fait <strong>10-15 % de différence</strong> (le reste dépend des totaux
        journaliers). Mais 10 % appliqués à long terme, c'est ce qui fait la différence entre
        un pratiquant qui progresse et un qui plafonne.
      </p>

      <h3>Avant la séance (1-2 h)</h3>
      <ul>
        <li><strong>Glucides complexes</strong> : riz, patate douce, avoine (40-60 g).</li>
        <li><strong>Protéines</strong> : poulet, œufs ou whey (25-30 g).</li>
        <li><strong>Lipides modérés</strong> (&lt; 10 g) — ils ralentissent la digestion.</li>
      </ul>
      <p>
        Exemple : <em>150 g riz cuit + 150 g blanc de poulet + petits légumes</em>.
      </p>

      <h3>Après la séance (dans les 2 h)</h3>
      <p>
        La fameuse « fenêtre anabolique » — moins stricte qu'on le disait dans les années 90,
        mais elle existe. Vise :
      </p>
      <ul>
        <li><strong>Protéines rapides</strong> : whey ou blanc d'œuf (25-40 g).</li>
        <li><strong>Glucides rapides ET complexes</strong> : banane + flocons d'avoine, ou riz basmati + miel.</li>
      </ul>
      <p>
        <strong>Pourquoi les glucides rapides</strong> ? Ils rechargent rapidement le glycogène
        musculaire épuisé et déclenchent un pic d'insuline qui accélère l'absorption des
        protéines.
      </p>

      <h3>Le reste de la journée</h3>
      <p>
        Répartis <strong>les protéines sur 4-5 prises</strong> (25-40 g à chaque fois), toutes
        les 3-4 heures. C'est le rythme optimal pour maintenir la synthèse musculaire. Les
        glucides et lipides suivent le cadre sans être aussi fractionnés.
      </p>

      <h2>Les 5 erreurs qui sabotent tes macros</h2>
      <ol>
        <li>
          <strong>Sous-estimer les portions</strong>. « 150 g de riz » à l'œil, c'est souvent
          200 g en vrai. La balance de cuisine (15 € sur Amazon) change la donne.
        </li>
        <li>
          <strong>Oublier les huiles et sauces</strong>. 1 cuillère à soupe d'huile = 135 kcal.
          2 cuillères pour cuire ton poulet + sauce soja + vinaigrette = 400 kcal invisibles.
        </li>
        <li>
          <strong>Compter les macros des aliments crus quand tu les manges cuits</strong> (ou
          l'inverse). 100 g de riz cru ≠ 100 g de riz cuit. Précise toujours le mode.
        </li>
        <li>
          <strong>Négliger les lipides en sèche</strong>. Passer sous 0,7 g/kg = crash
          hormonal (testostérone, humeur). Garde au moins 60 g de lipides/jour pour 75 kg.
        </li>
        <li>
          <strong>Surcompenser le lendemain d'un écart</strong>. Tu as mangé 3 500 kcal
          samedi soir ? Tu n'as pas besoin de 2 000 kcal dimanche. Reviens à ta cible normale
          (2 900), le métabolisme se lisse sur la semaine.
        </li>
      </ol>

      <h2>Exemple de journée complète — 2 900 kcal / 150 P / 406 G / 75 L</h2>
      <table>
        <thead>
          <tr>
            <th>Repas</th>
            <th>Contenu</th>
            <th>kcal / P / G / L</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Petit-déj (7h)</td>
            <td>80 g avoine + 300 ml lait demi-écrémé + 1 banane + 30 g whey</td>
            <td>~620 / 38 / 95 / 9</td>
          </tr>
          <tr>
            <td>Collation (10h)</td>
            <td>200 g Skyr + 30 g amandes + 1 pomme</td>
            <td>~440 / 28 / 35 / 18</td>
          </tr>
          <tr>
            <td>Pré-training (12h)</td>
            <td>150 g riz cuit + 180 g poulet + courgettes + 10 g huile olive</td>
            <td>~650 / 45 / 55 / 18</td>
          </tr>
          <tr>
            <td>Post-training (15h)</td>
            <td>30 g whey + 1 banane + 50 g flocons</td>
            <td>~390 / 28 / 55 / 5</td>
          </tr>
          <tr>
            <td>Dîner (20h)</td>
            <td>200 g saumon + 250 g patate douce + haricots verts</td>
            <td>~800 / 43 / 80 / 25</td>
          </tr>
        </tbody>
      </table>
      <p>
        <em>Total : ~2 900 kcal, 182 P / 320 G / 75 L — très proche de la cible, peut être
        ajusté en réduisant un peu la whey post-training ou en passant à 150 g de saumon.</em>
      </p>
      <div className="callout">
        <strong>C'est exactement ce que fait Ma Diét automatiquement</strong>. Tu rentres ces
        aliments avec des quantités approximatives, tu cliques « Optimiser », et les
        grammages s'ajustent en une seconde pour taper pile la cible. Tu peux même verrouiller
        les aliments dont tu tiens aux quantités (ex. 2 œufs précisément).
      </div>

      <h2>Adapter selon ton objectif</h2>
      <h3>Sèche</h3>
      <ul>
        <li>Protéines : <strong>2,2 g/kg</strong> (préserve le muscle en déficit).</li>
        <li>Lipides : <strong>0,8 g/kg</strong> (minimum hormonal).</li>
        <li>Glucides : ce qui reste (déficit de 400-500 kcal sur le maintien).</li>
      </ul>

      <h3>Prise de masse (lean bulk)</h3>
      <ul>
        <li>Protéines : <strong>1,6-2 g/kg</strong>.</li>
        <li>Lipides : <strong>1 g/kg</strong>.</li>
        <li>Glucides : <strong>5-6 g/kg</strong> (surplus de 200-300 kcal).</li>
      </ul>
      <p>
        Voir le <Link to="/blog/prise-de-masse-musculaire">guide complet prise de masse</Link>{' '}
        pour le détail.
      </p>

      <h3>Maintien (recomposition corporelle)</h3>
      <ul>
        <li>Protéines : <strong>1,8-2 g/kg</strong>.</li>
        <li>Lipides : <strong>1 g/kg</strong>.</li>
        <li>Glucides : reste à calories de maintenance.</li>
      </ul>
      <p>
        Pour calculer ton besoin précisément :{' '}
        <Link to="/blog/besoin-calorique-journalier">
          comment calculer ton besoin calorique
        </Link>
        .
      </p>

      <h2>Conclusion</h2>
      <p>
        Les macros, c'est l'outil qui sépare les pratiquants qui progressent de ceux qui
        stagnent. La règle simple : <strong>protéines et lipides fixés en premier, glucides
        pour remplir</strong>. Priorise les 4-5 prises de protéines, le pré/post-training
        glucidique, et la balance de cuisine.
      </p>
      <p>
        Si tu veux éviter le calcul manuel chaque jour,{' '}
        <Link to="/today">lance-toi sur Ma Diét</Link> — tu renseignes ton profil, l'app
        calcule tes cibles, et l'optimiseur ajuste tes grammages en 1 clic. Gratuit,
        connexion en 10 s.
      </p>
    </BlogLayout>
  );
}
