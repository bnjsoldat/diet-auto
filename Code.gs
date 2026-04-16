/**
 * ============================================================
 *  DIÉT AUTO — Optimiseur de quantités alimentaires
 * ============================================================
 *
 *  But : ajuster automatiquement les quantités (colonne F) de la
 *  feuille "Programme" active pour que le total journalier colle
 *  aux cibles calculées dans la feuille "Données" (kcal + macros).
 *
 *  Méthode : descente de gradient projetée minimisant la somme
 *  des erreurs relatives au carré sur kcal / P / G / L, sous les
 *  bornes [qmin, qmax] par aliment. Les aliments cochés dans la
 *  colonne Verrou (K) sont figés.
 *
 * ------------------------------------------------------------
 *  INSTALLATION (une seule fois)
 * ------------------------------------------------------------
 *  1. Ouvrir le Google Sheet "Programme alimentaire bnj".
 *  2. Menu :  Extensions  >  Apps Script
 *  3. Effacer le contenu par défaut et coller TOUT ce fichier.
 *  4. Cliquer sur l'icône disquette (Ctrl+S) pour sauvegarder.
 *  5. Revenir au Sheet et le recharger (F5).
 *  6. Un nouveau menu « Diét Auto » apparaît dans la barre.
 *
 * ------------------------------------------------------------
 *  PRÉPARATION DU SHEET (une seule fois)
 * ------------------------------------------------------------
 *  A) Dans CHAQUE feuille "Programme" à "Programme 7" :
 *     - Ajouter une colonne Verrou en K (titre en K7 : "Verrou").
 *     - Pour chaque ligne d'aliment (plages 8-17, 19-28, 30-39,
 *       41-49, 51-60), insérer une CASE À COCHER en colonne K
 *       (menu Insertion > Case à cocher).
 *     - Cochée = la quantité est figée.
 *     - Non cochée (par défaut) = la quantité sera ajustée.
 *
 *  B) (Optionnel) Dans "Toutes les recettes" :
 *     - Colonne G : "Qmin (g)"  -> quantité minimale par aliment
 *     - Colonne H : "Qmax (g)"  -> quantité maximale par aliment
 *     - Laisser vide pour utiliser les bornes par défaut (10g/400g).
 *
 * ------------------------------------------------------------
 *  UTILISATION QUOTIDIENNE
 * ------------------------------------------------------------
 *  1. Remplir les données perso dans "Données" (A2..F2).
 *  2. Ouvrir une feuille "Programme" et saisir les aliments
 *     voulus (colonne E) — les noms doivent correspondre à la
 *     base "Toutes les recettes" (sinon les lignes sont ignorées).
 *  3. Cocher éventuellement en K les aliments à figer.
 *  4. Menu  Diét Auto  >  Optimiser les quantités.
 *  5. Vérifier le résumé, les quantités (colonne F) sont ajustées
 *     et les formules existantes recalculent kcal/P/G/L.
 *
 *  Commande utile : Diét Auto > Vérifier configuration
 *  -> affiche les cibles lues et le nombre d'aliments reconnus.
 *
 * ============================================================
 *  CONFIGURATION  (modifier ici si la mise en page change)
 * ============================================================ */

const CONFIG = {
  // Noms des feuilles
  feuilleDonnees:  'Données',
  feuilleRecettes: 'Toutes les recettes',

  // --- Cellules des CIBLES dans la feuille "Données" ---------
  // Vérifié sur le Sheet réel :
  //   - C15  = Total calorique avec objectif (cible kcal finale)
  //   - A10  = Protéines (g), B10 = Glucides (g), C10 = Lipides (g)
  // (liste pour kcal permet de sommer plusieurs cellules si besoin)
  cellulesCibleKcal:     ['C15'],
  cellCibleProteines:    'A10',
  cellCibleGlucides:     'B10',
  cellCibleLipides:      'C10',

  // --- Plages de lignes d'aliments par repas (1-indexé) ------
  plagesAliments: [
    { debut:  8, fin: 17 },  // Repas 1
    { debut: 19, fin: 28 },  // Repas 2
    { debut: 30, fin: 39 },  // Repas 3
    { debut: 41, fin: 49 },  // Repas 4
    { debut: 51, fin: 60 },  // Repas 5
  ],

  // Colonnes (1-indexé) dans les feuilles Programme
  colAliment:  5,   // E
  colQuantite: 6,   // F
  colVerrou:   11,  // K

  // Colonnes (1-indexé) dans "Toutes les recettes"
  colRecetteNom:       2,  // B
  colRecetteKcal:      3,  // C
  colRecetteProteines: 4,  // D
  colRecetteGlucides:  5,  // E
  colRecetteLipides:   6,  // F
  colRecetteQmin:      7,  // G (optionnel)
  colRecetteQmax:      8,  // H (optionnel)

  // Bornes par défaut si Qmin/Qmax non renseignés
  qminDefaut: 10,
  qmaxDefaut: 400,

  // Paramètres de l'optimiseur
  maxIterations:     500,
  toleranceGradient: 1e-6,
  pasInitial:        20,     // ampleur initiale du pas (en g)
  pasMin:            1e-4,
  deplacementMaxParIter: 50, // aucune quantité ne bouge de plus de 50g par itération
  arrondiGrammes:    5,      // arrondi final des quantités au multiple de 5g
  poidsKcal:         2.0,    // priorité kcal dans la fonction objectif
  poidsMacro:        1.0,    // priorité par macro (P, G, L)
};

/* ============================================================
 *  MENU
 * ============================================================ */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Diét Auto')
    .addItem('Optimiser les quantités', 'optimiserProgramme')
    .addSeparator()
    .addItem('Vérifier configuration',  'verifierConfig')
    .addToUi();
}

/* ============================================================
 *  POINT D'ENTRÉE PRINCIPAL
 * ============================================================ */

function optimiserProgramme() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const feuille = ss.getActiveSheet();
  const nom = feuille.getName();

  if (!/^Programme/i.test(nom)) {
    ui.alert(
      'Feuille incorrecte',
      'Place-toi sur une feuille "Programme" (Programme, Programme 2, …) ' +
      'avant de lancer l\'optimiseur.\n\nFeuille active : ' + nom,
      ui.ButtonSet.OK);
    return;
  }

  try {
    const cibles  = lireCibles(ss);
    const baseNut = lireBaseNutritionnelle(ss);
    const lignes  = lireLignesAliments(feuille, baseNut);

    if (lignes.length === 0) {
      ui.alert(
        'Aucun aliment reconnu',
        'Aucun nom d\'aliment ne correspond à la base "Toutes les recettes".\n' +
        'Vérifie l\'orthographe exacte des aliments en colonne E.',
        ui.ButtonSet.OK);
      return;
    }

    const avant = calculerTotaux(lignes);
    const info  = optimiser(lignes, cibles);
    const apres = calculerTotaux(lignes);

    ecrireQuantites(feuille, lignes);
    afficherResume(ui, cibles, avant, apres, lignes, info);

  } catch (e) {
    ui.alert('Erreur', String(e && e.message ? e.message : e), ui.ButtonSet.OK);
  }
}

/* ============================================================
 *  LECTURE DES DONNÉES
 * ============================================================ */

function lireCibles(ss) {
  const f = ss.getSheetByName(CONFIG.feuilleDonnees);
  if (!f) throw new Error('Feuille "' + CONFIG.feuilleDonnees + '" introuvable.');

  let kcal = 0;
  for (const ref of CONFIG.cellulesCibleKcal) {
    const v = Number(f.getRange(ref).getValue());
    if (!isFinite(v)) throw new Error('Valeur invalide en ' + CONFIG.feuilleDonnees + '!' + ref + '.');
    kcal += v;
  }

  const prot = Number(f.getRange(CONFIG.cellCibleProteines).getValue());
  const gluc = Number(f.getRange(CONFIG.cellCibleGlucides).getValue());
  const lip  = Number(f.getRange(CONFIG.cellCibleLipides).getValue());

  if (!(kcal > 0)) throw new Error('Cible calorique <= 0. Vérifie ' + CONFIG.cellulesCibleKcal.join(' + ') + '.');
  if (!(prot > 0)) throw new Error('Cible protéines <= 0 en ' + CONFIG.cellCibleProteines + '.');
  if (!(gluc > 0)) throw new Error('Cible glucides <= 0 en '  + CONFIG.cellCibleGlucides  + '.');
  if (!(lip  > 0)) throw new Error('Cible lipides <= 0 en '   + CONFIG.cellCibleLipides   + '.');

  return { kcal, prot, gluc, lip };
}

function lireBaseNutritionnelle(ss) {
  const f = ss.getSheetByName(CONFIG.feuilleRecettes);
  if (!f) throw new Error('Feuille "' + CONFIG.feuilleRecettes + '" introuvable.');

  const derniereLigne = f.getLastRow();
  if (derniereLigne < 2) throw new Error('La base "' + CONFIG.feuilleRecettes + '" est vide.');

  const derniereCol = Math.max(CONFIG.colRecetteLipides, CONFIG.colRecetteQmax);
  const donnees = f.getRange(2, 1, derniereLigne - 1, derniereCol).getValues();

  const base = new Map();
  for (const row of donnees) {
    const nom = row[CONFIG.colRecetteNom - 1];
    if (!nom || typeof nom !== 'string') continue;
    const cle = normaliserNom(nom);
    if (!cle) continue;

    const kcal = Number(row[CONFIG.colRecetteKcal - 1])      || 0;
    const prot = Number(row[CONFIG.colRecetteProteines - 1]) || 0;
    const gluc = Number(row[CONFIG.colRecetteGlucides - 1])  || 0;
    const lip  = Number(row[CONFIG.colRecetteLipides - 1])   || 0;

    const qminV = row[CONFIG.colRecetteQmin - 1];
    const qmaxV = row[CONFIG.colRecetteQmax - 1];
    const qmin = (qminV !== '' && qminV !== null && isFinite(qminV)) ? Number(qminV) : CONFIG.qminDefaut;
    const qmax = (qmaxV !== '' && qmaxV !== null && isFinite(qmaxV)) ? Number(qmaxV) : CONFIG.qmaxDefaut;

    base.set(cle, {
      nom: String(nom).trim(),
      kcal, prot, gluc, lip,
      qmin: Math.max(0, qmin),
      qmax: Math.max(qmin, qmax),
    });
  }

  return base;
}

function lireLignesAliments(feuille, baseNut) {
  const lignes = [];
  const nbCols = CONFIG.colVerrou;

  for (const plage of CONFIG.plagesAliments) {
    const nbLignes = plage.fin - plage.debut + 1;
    const donnees = feuille.getRange(plage.debut, 1, nbLignes, nbCols).getValues();

    for (let i = 0; i < donnees.length; i++) {
      const numLigne = plage.debut + i;
      const nomBrut  = donnees[i][CONFIG.colAliment - 1];
      const qBrute   = donnees[i][CONFIG.colQuantite - 1];
      const verrou   = donnees[i][CONFIG.colVerrou - 1] === true;

      if (!nomBrut || typeof nomBrut !== 'string' || !String(nomBrut).trim()) continue;

      const info = baseNut.get(normaliserNom(nomBrut));
      if (!info) continue; // aliment inconnu dans la base -> ignoré

      const q0 = Number(qBrute);
      const qInit = isFinite(q0) && q0 > 0 ? q0 : (info.qmin + info.qmax) / 4;

      lignes.push({
        numLigne,
        nom: info.nom,
        kcal100: info.kcal,
        prot100: info.prot,
        gluc100: info.gluc,
        lip100:  info.lip,
        qmin: info.qmin,
        qmax: info.qmax,
        verrou,
        q: Math.max(info.qmin, Math.min(info.qmax, qInit)),
      });
    }
  }
  return lignes;
}

function normaliserNom(nom) {
  return String(nom).trim().toLowerCase().replace(/\s+/g, ' ');
}

/* ============================================================
 *  OPTIMISATION  (descente de gradient projetée)
 * ============================================================ */

function calculerTotaux(lignes) {
  let kcal = 0, prot = 0, gluc = 0, lip = 0;
  for (const l of lignes) {
    kcal += l.q * l.kcal100 / 100;
    prot += l.q * l.prot100 / 100;
    gluc += l.q * l.gluc100 / 100;
    lip  += l.q * l.lip100  / 100;
  }
  return { kcal, prot, gluc, lip };
}

function erreursRelatives(t, cibles) {
  return {
    eK: (t.kcal - cibles.kcal) / cibles.kcal,
    eP: (t.prot - cibles.prot) / cibles.prot,
    eG: (t.gluc - cibles.gluc) / cibles.gluc,
    eL: (t.lip  - cibles.lip)  / cibles.lip,
  };
}

function fonctionObjectif(lignes, cibles) {
  const e = erreursRelatives(calculerTotaux(lignes), cibles);
  return CONFIG.poidsKcal  * e.eK * e.eK
       + CONFIG.poidsMacro * (e.eP * e.eP + e.eG * e.eG + e.eL * e.eL);
}

function gradient(lignes, cibles) {
  const e = erreursRelatives(calculerTotaux(lignes), cibles);
  const g = new Array(lignes.length);
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i];
    if (l.verrou) { g[i] = 0; continue; }
    // df/dq_i = 2 * ( wK * eK/Tk * c_i/100 + wM * (eP/Tp * p_i/100 + eG/Tg * g_i/100 + eL/Tl * l_i/100) )
    g[i] = 2 * (
      CONFIG.poidsKcal  * e.eK / cibles.kcal * (l.kcal100 / 100) +
      CONFIG.poidsMacro * (
        e.eP / cibles.prot * (l.prot100 / 100) +
        e.eG / cibles.gluc * (l.gluc100 / 100) +
        e.eL / cibles.lip  * (l.lip100  / 100)
      )
    );
  }
  return g;
}

function norme(v) {
  let s = 0;
  for (const x of v) s += x * x;
  return Math.sqrt(s);
}

function optimiser(lignes, cibles) {
  let f = fonctionObjectif(lignes, cibles);
  let iter = 0;
  let converge = false;

  for (; iter < CONFIG.maxIterations; iter++) {
    const g = gradient(lignes, cibles);
    const nG = norme(g);
    if (nG < CONFIG.toleranceGradient) { converge = true; break; }

    // Sauvegarder les quantités
    const qBack = lignes.map(l => l.q);

    // Pas normalisé, borné en déplacement
    let alpha = CONFIG.pasInitial / Math.max(nG, 1e-9);
    if (alpha * nG > CONFIG.deplacementMaxParIter) {
      alpha = CONFIG.deplacementMaxParIter / nG;
    }

    // Line search par backtracking
    let trouve = false;
    for (let ls = 0; ls < 25; ls++) {
      for (let i = 0; i < lignes.length; i++) {
        if (lignes[i].verrou) continue;
        const nv = qBack[i] - alpha * g[i];
        lignes[i].q = Math.max(lignes[i].qmin, Math.min(lignes[i].qmax, nv));
      }
      const fNew = fonctionObjectif(lignes, cibles);
      if (fNew < f - 1e-12) { f = fNew; trouve = true; break; }
      alpha *= 0.5;
      if (alpha < CONFIG.pasMin) break;
    }

    if (!trouve) {
      // restaurer et stopper
      for (let i = 0; i < lignes.length; i++) lignes[i].q = qBack[i];
      converge = true;
      break;
    }
  }

  // Arrondi final au multiple de CONFIG.arrondiGrammes
  if (CONFIG.arrondiGrammes > 0) {
    for (const l of lignes) {
      if (l.verrou) continue;
      l.q = Math.round(l.q / CONFIG.arrondiGrammes) * CONFIG.arrondiGrammes;
      l.q = Math.max(l.qmin, Math.min(l.qmax, l.q));
    }
  }

  return { iterations: iter + 1, convergence: converge, fFinal: f };
}

/* ============================================================
 *  ÉCRITURE ET AFFICHAGE
 * ============================================================ */

function ecrireQuantites(feuille, lignes) {
  // Écriture groupée ligne par ligne (les lignes ne sont pas forcément contiguës)
  for (const l of lignes) {
    feuille.getRange(l.numLigne, CONFIG.colQuantite).setValue(l.q);
  }
}

function afficherResume(ui, cibles, avant, apres, lignes, info) {
  const r1 = (x) => Math.round(x * 10) / 10;
  const pct = (v, c) => {
    const p = (v - c) / c * 100;
    const s = p >= 0 ? '+' : '';
    return s + r1(p) + '%';
  };

  const verrouilles = lignes.filter(l => l.verrou).length;
  const ajustes = lignes.length - verrouilles;

  const msg =
    'OPTIMISATION TERMINÉE\n' +
    '──────────────────────────────\n' +
    'Aliments ajustés : ' + ajustes +
    (verrouilles ? '   (dont ' + verrouilles + ' verrouillé(s))' : '') + '\n' +
    'Itérations : ' + info.iterations +
    '   Convergence : ' + (info.convergence ? 'OUI' : 'limite max') + '\n\n' +

    'CIBLES\n' +
    '  kcal : ' + r1(cibles.kcal)  + '\n' +
    '  Prot : ' + r1(cibles.prot)  + ' g\n' +
    '  Gluc : ' + r1(cibles.gluc)  + ' g\n' +
    '  Lip  : ' + r1(cibles.lip)   + ' g\n\n' +

    'AVANT                           APRÈS\n' +
    '  kcal : ' + r1(avant.kcal).toString().padEnd(6)  + ' (' + pct(avant.kcal, cibles.kcal).padEnd(6) + ')     '
              + r1(apres.kcal) + ' (' + pct(apres.kcal, cibles.kcal) + ')\n' +
    '  Prot : ' + r1(avant.prot).toString().padEnd(6)  + ' (' + pct(avant.prot, cibles.prot).padEnd(6) + ')     '
              + r1(apres.prot) + ' (' + pct(apres.prot, cibles.prot) + ')\n' +
    '  Gluc : ' + r1(avant.gluc).toString().padEnd(6)  + ' (' + pct(avant.gluc, cibles.gluc).padEnd(6) + ')     '
              + r1(apres.gluc) + ' (' + pct(apres.gluc, cibles.gluc) + ')\n' +
    '  Lip  : ' + r1(avant.lip).toString().padEnd(6)   + ' (' + pct(avant.lip, cibles.lip).padEnd(6)  + ')     '
              + r1(apres.lip)  + ' (' + pct(apres.lip,  cibles.lip)  + ')\n';

  ui.alert('Diét Auto', msg, ui.ButtonSet.OK);
}

/* ============================================================
 *  OUTIL : VÉRIFICATION DE LA CONFIGURATION
 * ============================================================ */

function verifierConfig() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const lignes = [];

  const fD = ss.getSheetByName(CONFIG.feuilleDonnees);
  const fR = ss.getSheetByName(CONFIG.feuilleRecettes);
  lignes.push('Feuille "' + CONFIG.feuilleDonnees  + '" : ' + (fD ? 'OK' : 'INTROUVABLE'));
  lignes.push('Feuille "' + CONFIG.feuilleRecettes + '" : ' + (fR ? 'OK' : 'INTROUVABLE'));
  lignes.push('');

  if (fD) {
    try {
      const c = lireCibles(ss);
      lignes.push('Cibles lues :');
      lignes.push('  kcal = ' + c.kcal + '  (depuis ' + CONFIG.cellulesCibleKcal.join(' + ') + ')');
      lignes.push('  Prot = ' + c.prot + ' g (' + CONFIG.cellCibleProteines + ')');
      lignes.push('  Gluc = ' + c.gluc + ' g (' + CONFIG.cellCibleGlucides  + ')');
      lignes.push('  Lip  = ' + c.lip  + ' g (' + CONFIG.cellCibleLipides   + ')');
    } catch (e) {
      lignes.push('Erreur cibles : ' + e.message);
    }
    lignes.push('');
  }

  if (fR) {
    try {
      const base = lireBaseNutritionnelle(ss);
      lignes.push('Base nutritionnelle : ' + base.size + ' aliments chargés.');
    } catch (e) {
      lignes.push('Erreur base : ' + e.message);
    }
  }

  const active = ss.getActiveSheet();
  lignes.push('');
  lignes.push('Feuille active : ' + active.getName() +
    (/^Programme/i.test(active.getName()) ? '  (compatible)' : '  (non compatible)'));

  if (/^Programme/i.test(active.getName()) && fR) {
    try {
      const base = lireBaseNutritionnelle(ss);
      const ls = lireLignesAliments(active, base);
      lignes.push('Aliments reconnus sur cette feuille : ' + ls.length);
      const verr = ls.filter(l => l.verrou).length;
      if (verr) lignes.push('  dont verrouillés : ' + verr);
    } catch (e) {
      lignes.push('Erreur lecture programme : ' + e.message);
    }
  }

  ui.alert('Vérification configuration', lignes.join('\n'), ui.ButtonSet.OK);
}
