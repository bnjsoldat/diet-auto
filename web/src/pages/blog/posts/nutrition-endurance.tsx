import { Link } from 'react-router-dom';
import { BlogLayout, type BlogPostMeta } from '../BlogLayout';

export const meta: BlogPostMeta = {
  slug: 'nutrition-sport-endurance',
  title: "Nutrition sport d'endurance : course, vélo, trail, triathlon",
  description:
    "Combien de kcal et glucides pour un marathon, une sortie longue vélo, un trail ? Ration pré, pendant, post-effort. Plan concret pour coureurs et triathlètes.",
  publishedAt: '2026-04-25',
  readingMinutes: 10,
  keywords: [
    'nutrition endurance',
    'nutrition marathon',
    'nutrition trail',
    'nutrition triathlon',
    'nutrition cycliste',
    'ration sportive',
    'glucides endurance',
    'alimentation coureur',
  ],
};

export default function Post() {
  return (
    <BlogLayout meta={meta}>
      <p>
        En sport d'endurance, la nutrition pèse <strong>autant que l'entraînement</strong>.
        Un marathon raté, un trail craqué au km 30, une sortie vélo qui vire à la fringale à
        2h de chez toi : 90 % du temps, c'est une erreur nutritionnelle, pas une question de
        forme physique.
      </p>
      <p>
        Ce guide couvre les <strong>3 phases critiques</strong> : la veille / ration pré-effort,
        la ration pendant, et la récupération. Avec les chiffres exacts pour course à pied,
        vélo, trail et triathlon.
      </p>

      <h2>Le principe fondamental : les stocks de glycogène</h2>
      <p>
        Ton corps a <strong>deux carburants principaux</strong> en sport :
      </p>
      <ul>
        <li>
          <strong>Le glycogène</strong> (glucides stockés dans les muscles et le foie) :
          le carburant premium. Rapide à mobiliser, haute intensité. Stock total :{' '}
          <strong>~400-500 g (soit 1 600-2 000 kcal)</strong>. Épuisable en 60-120 min d'effort
          soutenu.
        </li>
        <li>
          <strong>Les graisses</strong> : quasiment illimitées (même chez un coureur sec).
          Mais mobilisation lente, intensité faible à modérée uniquement.
        </li>
      </ul>
      <p>
        <strong>Règle d'or endurance</strong> : tu brûles du glycogène pendant l'effort, tu
        le rechargeais avant, tu le reconstitues après. Si tu épuises sans recharger pendant,
        c'est <em>le mur</em>.
      </p>

      <h2>La veille de l'effort (J-1)</h2>

      <h3>Pour une course &lt; 1h (10 km, trail court &lt; 15 km)</h3>
      <p>
        <strong>Alimentation normale</strong>. Pas besoin de charge glucidique. Vise juste un
        repas du soir équilibré avec 1-1,5 g glucides/kg (= 70-100 g pour 70 kg).
      </p>

      <h3>Pour une course de 1h à 3h (semi-marathon, vélo &lt; 80 km)</h3>
      <p>
        <strong>Augmente les glucides la veille</strong> : repas du soir avec{' '}
        <strong>2 g/kg de glucides</strong> (= 140 g pour 70 kg). Exemple :
      </p>
      <ul>
        <li>250 g riz cuit (60 g glucides) + 200 g patate douce (30 g) + pâtes 100 g cuit (30 g) + pain (20 g) = ~140 g</li>
      </ul>

      <h3>Pour une course &gt; 3h (marathon, ultra, cyclosportive longue)</h3>
      <p>
        <strong>Surcharge glucidique sur 2-3 jours</strong> (J-3 à J-1) :{' '}
        <strong>7-10 g/kg de glucides/jour</strong> (= 500-700 g pour 70 kg). C'est énorme et
        demande de la préparation. Objectif : maximiser les stocks de glycogène.
      </p>
      <p>
        Exemples d'aliments denses : <em>pâtes complètes, riz basmati, patate douce, avoine,
        pain blanc, banane, miel, compote, dattes</em>.
      </p>

      <div className="callout">
        <strong>Attention aux fibres</strong> : 24h avant, réduis les légumes crus et
        légumineuses. Elles ralentissent la digestion et peuvent te surprendre pendant
        l'effort. Préfère riz blanc, pâtes blanches, patate douce épluchée.
      </div>

      <h2>Le matin de l'effort (J-J)</h2>

      <h3>Petit-déj 3h avant le départ (idéal)</h3>
      <ul>
        <li>
          <strong>Glucides complexes</strong> : 80-120 g d'avoine + 1 banane + 1 c. soupe miel
          = ~100 g glucides
        </li>
        <li>
          <strong>Protéines légères</strong> : 20-30 g (œufs brouillés, skyr, whey)
        </li>
        <li>
          <strong>Lipides très modérés</strong> : &lt; 10 g (ralentissent la digestion)
        </li>
        <li><strong>Boisson</strong> : 500 ml d'eau + électrolytes éventuellement</li>
      </ul>

      <h3>Si tu pars dans 1h ou moins</h3>
      <p>
        <strong>Petit déj minimaliste</strong> : banane + biscuit énergétique + 300 ml eau.
        Environ 30-40 g de glucides. Le reste, tu le mangeras pendant l'effort.
      </p>

      <h2>Pendant l'effort</h2>

      <p>
        La règle de base par heure d'effort :
      </p>
      <table>
        <thead>
          <tr>
            <th>Durée</th>
            <th>Glucides/h</th>
            <th>Hydratation</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>&lt; 1h</td>
            <td>0 nécessaire (eau suffit)</td>
            <td>500-750 ml/h</td>
          </tr>
          <tr>
            <td>1-2h</td>
            <td>30-40 g/h</td>
            <td>500-750 ml/h</td>
          </tr>
          <tr>
            <td>2-3h</td>
            <td>40-60 g/h</td>
            <td>600-900 ml/h</td>
          </tr>
          <tr>
            <td>3h+</td>
            <td>60-90 g/h (multi-sources)</td>
            <td>700-1000 ml/h</td>
          </tr>
        </tbody>
      </table>

      <h3>Exemples concrets par 40 g de glucides</h3>
      <ul>
        <li>1 gel énergétique (25-30 g) + 500 ml boisson (20-30 g) → 50-60 g</li>
        <li>1 banane (25 g) + 1 barre (15 g) → 40 g</li>
        <li>1 bidon boisson maltodextrine 500 ml (60 g) → 60 g</li>
        <li>30 g de pâte de dattes maison (20 g) + 1 compote (15 g) → 35 g</li>
      </ul>

      <div className="callout">
        <strong>Astuce pros</strong> : au-delà de 60 g/h, utilise du{' '}
        <strong>2:1 glucose/fructose</strong> (disponible dans les gels "multi-sources"). Ça
        permet d'absorber plus de glucides sans saturer le transport intestinal.
      </div>

      <h3>Hydratation</h3>
      <p>
        Par effort chaud (&gt; 20°C), vise <strong>600-1000 ml/h</strong>. Ajoute{' '}
        <strong>1-1,5 g de sel/L</strong> (sodium) pour compenser la sueur, surtout au-delà
        de 2h.
      </p>

      <h2>Après l'effort (récupération)</h2>

      <h3>Dans les 30 min (fenêtre optimale)</h3>
      <p>
        <strong>Ratio classique 4:1 glucides/protéines</strong>. Objectif : recharger le
        glycogène vite. Exemples :
      </p>
      <ul>
        <li>250 ml lait chocolaté (40 g G / 10 g P) ← légendaire</li>
        <li>1 banane + 30 g whey + 50 g flocons mélangés (70 g G / 30 g P)</li>
        <li>1 pot skyr (20 g P) + miel 30 g + fruits secs 40 g (80 g G / 20 g P)</li>
      </ul>

      <h3>Dans les 2 heures (repas complet)</h3>
      <ul>
        <li><strong>Glucides</strong> : 1-1,2 g/kg de poids (70-85 g pour 70 kg) — riz, patate, pâtes</li>
        <li><strong>Protéines</strong> : 25-40 g — poulet, poisson, œufs</li>
        <li><strong>Lipides</strong> : 15-25 g — huile olive, avocat</li>
        <li><strong>Légumes</strong> : à volonté (vitamines anti-oxydantes)</li>
      </ul>

      <h2>Plans spécifiques par discipline</h2>

      <h3>🏃 Marathon (4h pour un coureur de 75 kg)</h3>
      <ul>
        <li><strong>J-3 à J-1</strong> : 8 g/kg glucides = 600 g/jour</li>
        <li><strong>J-J matin (3h avant)</strong> : 100 g glucides + 500 ml eau</li>
        <li><strong>Pendant</strong> : 60 g glucides/h × 4h = 240 g (7-8 gels + 1,5 L boisson sucrée)</li>
        <li><strong>Post</strong> : 100 g glucides + 40 g protéines dans les 30 min</li>
      </ul>

      <h3>🚴 Cyclosportive 5h (120 km)</h3>
      <ul>
        <li><strong>Pendant</strong> : 70-90 g/h (le vélo permet plus de tolérance digestive que la course)</li>
        <li>Mix solide + liquide : 1 bidon boisson/h + 1 barre ou gel toutes les 45 min</li>
        <li>Ne pas oublier de manger "vrai" au bout de 3h : 1 sandwich au jambon, 1 banane</li>
      </ul>

      <h3>🥾 Trail 3h (30 km D+1000)</h3>
      <ul>
        <li>Plus de flexibilité : tu peux marcher en montée pour manger solide</li>
        <li>Mix : gels pour les intensités hautes, barres / dattes / fruits secs pour les sections plus roulantes</li>
        <li><strong>Sel crucial</strong> en été : 1-2 g/L dans la boisson</li>
      </ul>

      <h3>🏊 Triathlon (Half Ironman ~5h30)</h3>
      <ul>
        <li><strong>Natation</strong> : rien à manger. Avant : gel 30 min avant le départ</li>
        <li><strong>Vélo 90 km</strong> : le moment pour manger le plus (80-90 g/h, solide + liquide)</li>
        <li><strong>Course 21 km</strong> : passe en gels + liquide (digestion plus dure en course)</li>
      </ul>

      <h2>Les 5 erreurs classiques</h2>
      <ol>
        <li>
          <strong>Tester des gels nouveaux le jour J</strong>. Règle d'or : jamais rien de
          nouveau en compétition. Teste à l'entraînement.
        </li>
        <li>
          <strong>Se déshydrater volontairement avant</strong> ("je vais aux toilettes si je
          bois"). Résultat : crampes + baisse de 10-15 % de perf.
        </li>
        <li>
          <strong>Oublier le sel</strong> sur des efforts &gt; 2h chauds. Hyponatrémie (trop
          d'eau, pas assez de sodium) = crampes + nausées.
        </li>
        <li>
          <strong>Manger trop gras la veille</strong>. Pizzeria 4 fromages à 20h la veille
          d'un marathon = digestion incomplète + troubles intestinaux le lendemain.
        </li>
        <li>
          <strong>Zapper la récup post-effort</strong>. Tu rentres, tu dors 2h, tu manges 4h
          plus tard → glycogène pas rechargé, courbatures amplifiées, perf J+2 plombée.
        </li>
      </ol>

      <h2>Comment Ma Diét s'intègre</h2>
      <p>
        En période d'entraînement normal, tes besoins journaliers peuvent facilement dépasser{' '}
        <strong>3 500 kcal avec 5-6 g/kg de glucides</strong>. Ma Diét calcule tout ça pour
        toi :
      </p>
      <ul>
        <li>
          <strong>Profil "Très actif" ou "Extrêmement actif"</strong> → coef adapté (sauf si
          Strava connecté, là on bascule sur du précis kcal-par-kcal)
        </li>
        <li>
          <strong>Intégration Strava</strong> → chaque entraînement est automatiquement
          comptabilisé, la cible du jour s'ajuste. Tu cours 20 km ce matin ?{' '}
          <strong>+1 200 kcal brûlés ajoutés automatiquement</strong>, tes macros recalculent,
          tu sais exactement quoi manger pour recharger.
        </li>
        <li>
          <strong>Modèle "sportif"</strong> pré-fait avec un ratio 60/20/20 (G/P/L)
          typique endurance
        </li>
      </ul>
      <p>
        <Link to="/today">Lance ton plan du jour</Link> — parfait pour les semaines avec
        grosses sorties + jours de repos alternés.
      </p>
      <p>
        Pour plus de contexte :{' '}
        <Link to="/blog/besoin-calorique-journalier">calcul du besoin calorique exact</Link> •{' '}
        <Link to="/blog/macros-musculation-guide">répartition des macros</Link>.
      </p>
    </BlogLayout>
  );
}
