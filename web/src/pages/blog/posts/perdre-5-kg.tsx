import { Link } from 'react-router-dom';
import { BlogLayout, type BlogPostMeta } from '../BlogLayout';

export const meta: BlogPostMeta = {
  slug: 'perdre-5-kg-en-2-mois',
  title: 'Perdre 5 kg en 2 mois : plan alimentaire réaliste et efficace',
  description:
    'Le calcul exact du déficit calorique, la répartition des repas, les aliments à privilégier et les erreurs à éviter. Plan concret pour 8 semaines sans effet yo-yo.',
  publishedAt: '2026-04-21',
  readingMinutes: 9,
  keywords: [
    'perdre 5 kg',
    'perdre 5 kg en 2 mois',
    'plan alimentaire',
    'déficit calorique',
    'régime',
    'perte de poids rapide',
    'rééquilibrage alimentaire',
  ],
};

export default function Post() {
  return (
    <BlogLayout meta={meta}>
      <p>
        Perdre <strong>5 kg en 2 mois</strong>, c'est un objectif réaliste et <em>sain</em> si
        tu t'y prends avec méthode. Cela correspond à <strong>0,6 kg par semaine</strong> en
        moyenne, soit un rythme que la plupart des diététiciens considèrent comme
        « durable » : ni trop lent pour te démotiver, ni trop rapide pour perdre du muscle.
      </p>
      <p>
        Ce qui suit est <strong>la méthode complète</strong> : le calcul du déficit, la
        répartition des repas, les aliments à privilégier, et comment ne pas reprendre les
        kilos après. Zéro produit miracle, zéro cétogène ultra-restrictif, zéro « 1 200 kcal
        à vie ». Juste de la nutrition appliquée.
      </p>

      <h2>Le calcul du déficit : combien en moins par jour ?</h2>
      <p>
        1 kg de graisse ≈ <strong>7 700 kcal</strong> stockées. Donc perdre 5 kg = créer un
        déficit total de 38 500 kcal sur la période. Divisé sur 8 semaines (56 jours) →{' '}
        <strong>687 kcal de déficit par jour</strong>.
      </p>
      <p>
        Ce chiffre peut sembler élevé, mais il inclut <strong>les deux leviers</strong> :
        manger moins <em>et</em> bouger plus. En pratique :
      </p>
      <ul>
        <li>
          <strong>~450 kcal</strong> via l'alimentation (tu manges ça en moins par rapport à
          ta maintenance)
        </li>
        <li>
          <strong>~250 kcal</strong> via l'activité (équivalent à ~30 min de vélo, 45 min de
          marche rapide, ou 25 min de course)
        </li>
      </ul>
      <p>
        Tu peux faire tout par l'alimentation (déficit 700 kcal sans sport), mais tu perdras
        plus de muscle et tu auras plus faim. L'équilibre 450/250 est optimal.
      </p>

      <h3>Calcule ta cible précise</h3>
      <p>
        Si tu ne l'as pas encore fait, lis d'abord{' '}
        <Link to="/blog/besoin-calorique-journalier">comment calculer ton besoin calorique</Link>{' '}
        pour obtenir ta maintenance. Une fois ce chiffre connu, retire 450 kcal. C'est ta
        cible.
      </p>
      <p>
        <strong>Exemple concret :</strong> un homme de 35 ans, 85 kg, 1,78 m, légèrement
        actif a une maintenance ≈ 2 500 kcal. Sa cible perte = <strong>2 050 kcal/jour</strong>
        avec 2-3 séances de sport hebdo.
      </p>

      <h2>La répartition des macros en perte</h2>
      <p>
        Pendant un déficit, ta priorité n°1 est de{' '}
        <strong>préserver ton muscle</strong> (il est actif métaboliquement, donc tu veux le
        garder pour ne pas ralentir ton métabolisme). La règle d'or :
      </p>
      <div className="callout">
        <strong>Protéines : 2 g par kg de poids corporel par jour</strong> (vs 1,6 g hors
        déficit). Ça fait beaucoup mais c'est vital pendant une perte.
      </div>
      <p>Pour notre homme de 85 kg :</p>
      <ul>
        <li>
          <strong>Protéines</strong> : 85 × 2 = 170 g/jour (680 kcal, 33 % du total)
        </li>
        <li>
          <strong>Lipides</strong> : ~65 g/jour (585 kcal, 29 % — minimum 0,8 g/kg pour les
          hormones)
        </li>
        <li>
          <strong>Glucides</strong> : le reste, soit ~200 g/jour (785 kcal, 38 %)
        </li>
      </ul>
      <p>
        Ajuste selon ta préférence : certains préfèrent <em>plus de glucides moins de gras</em>{' '}
        (typique endurance), d'autres l'inverse. Mais les <strong>protéines restent fixes</strong>{' '}
        à 2 g/kg, c'est non négociable en perte.
      </p>

      <h2>Répartition sur la journée</h2>
      <p>
        Peu importe que tu manges <strong>3 repas ou 5 repas</strong>, ce qui compte c'est le
        total journalier. Choisis la répartition qui colle à tes horaires. Voici deux exemples
        qui fonctionnent bien en perte :
      </p>

      <h3>Schéma 3 repas (simple, tient la faim)</h3>
      <table>
        <thead>
          <tr>
            <th>Repas</th>
            <th>% kcal</th>
            <th>Type d'aliments</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Petit-déj</td>
            <td>30 %</td>
            <td>Protéines + céréales complètes + fruit</td>
          </tr>
          <tr>
            <td>Déjeuner</td>
            <td>40 %</td>
            <td>Protéines maigres + féculent + légumes à volonté + huile</td>
          </tr>
          <tr>
            <td>Dîner</td>
            <td>30 %</td>
            <td>Protéines maigres + légumes + féculent léger</td>
          </tr>
        </tbody>
      </table>

      <h3>Schéma 5 prises (idéal si tu as faim ou si tu fais du sport)</h3>
      <table>
        <thead>
          <tr>
            <th>Repas</th>
            <th>% kcal</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Petit-déj</td>
            <td>25 %</td>
          </tr>
          <tr>
            <td>Collation matin</td>
            <td>10 %</td>
          </tr>
          <tr>
            <td>Déjeuner</td>
            <td>30 %</td>
          </tr>
          <tr>
            <td>Collation après-midi</td>
            <td>10 %</td>
          </tr>
          <tr>
            <td>Dîner</td>
            <td>25 %</td>
          </tr>
        </tbody>
      </table>

      <h2>Les aliments qui marchent (et ceux qui sabotent)</h2>

      <h3>À privilégier (haute densité nutritionnelle, peu caloriques)</h3>
      <ul>
        <li>
          <strong>Protéines maigres</strong> : blanc de poulet, dinde, thon au naturel,
          colin, œufs, fromage blanc 0-3 %, yaourt grec 0 %, tofu, lentilles, pois chiches
        </li>
        <li>
          <strong>Légumes à volonté</strong> : courgettes, brocolis, épinards, haricots
          verts, poivrons, tomates, salade, carottes (une grande assiette par repas ne coûte
          que 50-100 kcal)
        </li>
        <li>
          <strong>Féculents complets en portions contrôlées</strong> : riz basmati, quinoa,
          pâtes complètes, patate douce, flocons d'avoine
        </li>
        <li>
          <strong>Bonnes graisses en petite quantité</strong> : huile d'olive, avocat (¼ ou
          ½ par jour), amandes/noix (une poignée = 15-20 g), saumon
        </li>
        <li>
          <strong>Fruits frais</strong> : 2-3 par jour, pas plus si tu stagnes (les sucres
          des fruits comptent)
        </li>
      </ul>

      <h3>À limiter ou éviter en période de perte</h3>
      <ul>
        <li>
          <strong>Alcool</strong> : 7 kcal/g, vides en nutriments, et ralentit l'oxydation
          des graisses pendant 36 h après consommation
        </li>
        <li>
          <strong>Boissons sucrées</strong> (sodas, jus industriels, smoothies) : 120-180 kcal
          par verre sans satiété
        </li>
        <li>
          <strong>Plats préparés et charcuterie</strong> : ultra-transformés, très salés
          (rétention d'eau), souvent gras et sucrés à la fois
        </li>
        <li>
          <strong>Pâtisseries, viennoiseries, chocolat au lait</strong> : aliments plaisir
          qu'on réintroduit une fois ou deux par semaine, pas tous les jours
        </li>
      </ul>

      <div className="callout">
        <strong>Règle simple :</strong> si un aliment passe par une usine avant d'arriver
        dans ton assiette, il est probablement calorique + pauvre en nutriments. Privilégie
        le brut.
      </div>

      <h2>Les 5 erreurs qui cassent la perte</h2>

      <h3>1. Sauter le petit-déj « pour aller plus vite »</h3>
      <p>
        Ça peut marcher pour certains (jeûne intermittent), mais le risque c'est d'exploser
        au déjeuner ou dans l'après-midi. Si tu n'as pas faim le matin, commence par un
        yaourt grec + 1 fruit = 150 kcal pour amorcer la satiété.
      </p>

      <h3>2. Oublier les protéines</h3>
      <p>
        Sans 2 g/kg de protéines, tu perds 30-40 % de muscle dans les kilos perdus. Résultat :
        tu es plus maigre mais avec moins de force, et ton métabolisme a baissé. Au moindre
        relâchement, tu reprends tout en gras. <strong>Les protéines sont non négociables.</strong>
      </p>

      <h3>3. Descendre trop bas en calories</h3>
      <p>
        En dessous de <strong>1 200 kcal pour une femme</strong> ou <strong>1 500 kcal pour
        un homme</strong>, ton corps entre en mode « famine » : il économise l'énergie, se
        débarrasse du muscle (coûteux à maintenir), te fatigue. Un déficit de 400-500 kcal
        est largement suffisant.
      </p>

      <h3>4. Se peser tous les jours et paniquer</h3>
      <p>
        Le poids fluctue de 1-2 kg selon l'hydratation, le sel, le cycle menstruel, les
        selles. <strong>Pèse-toi une seule fois par semaine</strong>, le même jour, à jeun.
        Compare les moyennes sur 4 semaines, pas les pics quotidiens.
      </p>

      <h3>5. Ne rien noter</h3>
      <p>
        Sans tracker ce que tu manges, tu sous-estimes systématiquement de 20-30 %. Ce n'est
        pas de la malhonnêteté — c'est juste que l'humain est mauvais pour estimer les
        portions. Pendant au moins les 2-3 premières semaines, note tout, pèse ce que tu
        peux. Après, tu auras intériorisé les ordres de grandeur.
      </p>

      <h2>Le sport : complément indispensable</h2>
      <p>
        Pour les 250 kcal de dépense active qu'on a prévus dans le calcul initial, voici ce
        qui marche le mieux en perte :
      </p>
      <ul>
        <li>
          <strong>Musculation 2-3×/semaine</strong> : protège le muscle pendant le déficit,
          remonte le métabolisme, forme le corps. <em>Priorité n°1.</em>
        </li>
        <li>
          <strong>Cardio modéré 2-3×/semaine</strong> : marche rapide, vélo, natation. 30-45
          min par séance. Consomme des calories sans trop épuiser le système nerveux.
        </li>
        <li>
          <strong>Bouger au quotidien</strong> : viser 8 000-10 000 pas/jour. L'activité
          spontanée (NEAT) fait plus de différence que tu ne crois.
        </li>
      </ul>

      <h2>Comment ne pas reprendre après</h2>
      <p>
        C'est le vrai défi : <strong>70 % des gens qui perdent du poids le reprennent dans
        les 2 ans</strong>. Pour faire partie des 30 % qui tiennent :
      </p>
      <ol>
        <li>
          <strong>Sors du déficit progressivement</strong> : après les 2 mois, remonte de 100
          kcal/jour chaque semaine jusqu'à revenir à ta <em>nouvelle</em> maintenance (qui est
          plus basse qu'avant puisque tu pèses moins).
        </li>
        <li>
          <strong>Garde les habitudes alimentaires</strong> : si tu as mangé comme ça pendant
          2 mois, continue 80 % du temps. Les 20 % restants = flexibilité (resto, apéro,
          gâteau).
        </li>
        <li>
          <strong>Continue la musculation</strong> : sans la maintenir, tu reperds le muscle
          gagné et le métabolisme redescend.
        </li>
        <li>
          <strong>Reprends le tracking 1-2 semaines si le poids remonte</strong>. Ça suffit
          généralement pour remettre le curseur au bon endroit.
        </li>
      </ol>

      <h2>Laisse l'app gérer les calculs</h2>
      <p>
        Faire ces calculs à la main est fastidieux. <Link to="/">Ma Diét</Link> prend en
        charge toute la partie arithmétique : tu renseignes ton profil, ton objectif « perte
        de poids modérée », et tu obtiens ta cible + macros. Ensuite tu composes tes repas
        avec les aliments que tu aimes, l'optimiseur ajuste les quantités pour atteindre
        exactement la cible.
      </p>
      <p>
        L'app affiche aussi tes <strong>fibres, sucres, sel et acides gras saturés</strong> —
        les 4 micronutriments qui font vraiment la différence en perte de poids, en plus des
        macros habituelles.
      </p>

      <h2>En résumé</h2>
      <ul>
        <li>5 kg en 2 mois = déficit de 450 kcal/jour + 250 kcal d'activité</li>
        <li>Protéines à 2 g/kg de poids : non négociable</li>
        <li>Aliments bruts, peu transformés, légumes à volonté</li>
        <li>Musculation 2-3×/semaine pour protéger le muscle</li>
        <li>Pèse-toi une fois par semaine, compare les moyennes</li>
        <li>Sors du déficit progressivement pour ne pas reprendre</li>
      </ul>
      <p>
        Ce n'est pas sexy. Ce n'est pas un produit miracle. Mais <strong>ça marche</strong>,
        et surtout ça tient dans la durée.
      </p>
    </BlogLayout>
  );
}
