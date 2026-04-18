import jsPDF from 'jspdf';
import type { DayPlan, Profile, Targets } from '@/types';
import { foodsByName } from './foods';
import { totalsForItems } from './optimizer';
import { friendlyDate } from './utils';

/** Génère un PDF A4 du plan du jour, déclenche le téléchargement */
export function exportDayPlanPDF(plan: DayPlan, profile: Profile, targets: Targets) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // Titre
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text('Ma Diét', 20, y);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(friendlyDate(plan.date), pageW - 20, y, { align: 'right' });
  y += 8;

  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(`${profile.nom} — ${profile.objectif}`, 20, y);
  y += 8;

  // Cibles
  doc.setDrawColor(230);
  doc.setLineWidth(0.3);
  doc.line(20, y, pageW - 20, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Cibles du jour', 20, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${targets.kcalCible} kcal  •  P ${targets.prot} g  •  G ${targets.gluc} g  •  L ${targets.lip} g`,
    20,
    y
  );
  y += 8;

  // Repas
  let totalKcal = 0, totalP = 0, totalG = 0, totalL = 0;
  for (const meal of plan.meals) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(meal.nom, 20, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40);

    for (const item of meal.items) {
      const food = foodsByName.get(item.nom.toLowerCase());
      if (!food) continue;
      const kcal = (item.quantite * food.kcal) / 100;
      const line = `• ${item.nom}`;
      const qty = `${item.quantite} g`;
      const cal = `${Math.round(kcal)} kcal`;
      doc.text(line.length > 70 ? line.slice(0, 68) + '…' : line, 22, y);
      doc.text(qty, pageW - 55, y, { align: 'right' });
      doc.text(cal, pageW - 20, y, { align: 'right' });
      y += 4.5;
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
    }

    const mealTotals = totalsForItems(meal.items, foodsByName);
    totalKcal += mealTotals.kcal;
    totalP += mealTotals.prot;
    totalG += mealTotals.gluc;
    totalL += mealTotals.lip;

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(110);
    doc.setFontSize(8);
    doc.text(
      `Total repas : ${Math.round(mealTotals.kcal)} kcal  |  P ${mealTotals.prot.toFixed(1)}g · G ${mealTotals.gluc.toFixed(1)}g · L ${mealTotals.lip.toFixed(1)}g`,
      22,
      y
    );
    y += 7;
  }

  // Résumé
  doc.setDrawColor(230);
  doc.line(20, y, pageW - 20, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text('Total journalier', 20, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `${Math.round(totalKcal)} kcal  •  P ${totalP.toFixed(1)} g  •  G ${totalG.toFixed(1)} g  •  L ${totalL.toFixed(1)} g`,
    20,
    y
  );
  y += 5;

  doc.setTextColor(110);
  doc.setFontSize(9);
  doc.text(
    `Écart cible : ${Math.round(totalKcal - targets.kcalCible)} kcal (${(((totalKcal - targets.kcalCible) / targets.kcalCible) * 100).toFixed(1)}%)`,
    20,
    y
  );

  doc.save(`diet-auto_${plan.date}.pdf`);
}
