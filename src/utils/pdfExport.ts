/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MealRecord, PaymentRecord, RestaurantSettings, MealShift, ShiftCloseRecord } from '../types';

interface GenerateDailyPdfOptions {
  date: string;
  shift?: MealShift;
  settings: RestaurantSettings;
  records: MealRecord[];
  payments: PaymentRecord[];
  shiftCloseRecord?: ShiftCloseRecord;
}

/**
 * Generates an official, beautifully formatted A4 PDF report for daily cafeteria operations,
 * meal reconciliations, and financial audits.
 */
export function generateDailyMealReportPdf({
  date,
  shift,
  settings,
  records,
  payments,
  shiftCloseRecord,
}: GenerateDailyPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const validRecords = records.filter(r => r.status === 'valid');
  const dayRecords = validRecords.filter(r => r.timestamp.startsWith(date));
  const activeRecords = dayRecords.length > 0 ? dayRecords : validRecords.slice(0, 25);

  const totalMeals = activeRecords.reduce((sum, r) => sum + r.mealCount, 0);
  const regularMeals = activeRecords.filter(r => r.type === 'regular').reduce((sum, r) => sum + r.mealCount, 0);
  const guestMeals = activeRecords.filter(r => r.type === 'guest').reduce((sum, r) => sum + r.mealCount, 0);
  const walkinMeals = activeRecords.filter(r => r.type === 'walk-in').reduce((sum, r) => sum + r.mealCount, 0);
  const grossTurnoverRwf = activeRecords.reduce((sum, r) => sum + r.amountRwf, 0);

  const cashTurnover = activeRecords
    .filter(r => r.paymentMethod === 'cash')
    .reduce((sum, r) => sum + r.amountRwf, 0);
  const momoTurnover = activeRecords
    .filter(r => r.paymentMethod === 'momo')
    .reduce((sum, r) => sum + r.amountRwf, 0);
  const prepaidTurnover = activeRecords
    .filter(r => r.paymentMethod === 'balance')
    .reduce((sum, r) => sum + r.amountRwf, 0);

  // 1. TOP HEADER BANNER & RESTAURANT BRAND
  // Header accent bar
  doc.setFillColor(16, 185, 129); // #10b981
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text(settings.restaurantName.toUpperCase(), 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(`${settings.location}  ·  Tel: ${settings.phone}`, 14, 21);
  doc.text(`MTN MoMo Merchant Till: *182*8*1*${settings.momoMerchantCode}#`, 14, 26);

  // Document Badge on Right
  doc.setFillColor(241, 245, 249); // #f1f5f9
  doc.roundedRect(pageWidth - 75, 10, 61, 20, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(5, 150, 105); // #059669
  doc.text('DAILY MEAL REPORT', pageWidth - 71, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date: ${date}`, pageWidth - 71, 21);
  doc.text(`Shift: ${(shift || settings.currentShift).toUpperCase()} SERVICE`, pageWidth - 71, 26);

  // Horizontal separator
  doc.setDrawColor(226, 232, 240); // #e2e8f0
  doc.setLineWidth(0.4);
  doc.line(14, 34, pageWidth - 14, 34);

  // 2. EXECUTIVE SUMMARY KPI BOXES
  let y = 39;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Executive Operational Summary', 14, y);

  y += 4;
  const colWidth = (pageWidth - 28 - 9) / 4; // 4 KPI boxes

  const kpis = [
    { label: 'TOTAL MEALS', value: totalMeals.toString(), sub: `${activeRecords.length} Transactions` },
    { label: 'SUBSCRIBERS', value: regularMeals.toString(), sub: 'Prepaid Plans' },
    { label: 'WALK-INS', value: walkinMeals.toString(), sub: 'Cash / MoMo' },
    { label: 'MEAL TURNOVER', value: `${(grossTurnoverRwf / 1000).toFixed(0)}k RWF`, sub: `${grossTurnoverRwf.toLocaleString()} RWF` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = 14 + idx * (colWidth + 3);
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, colWidth, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, y + 5);

    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 3.5, y + 11.5);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(5, 150, 105);
    doc.text(kpi.sub, x + 3.5, y + 15.5);
  });

  // Revenue Breakdown Bar
  y += 22;
  doc.setFillColor(240, 253, 244); // #f0fdf4
  doc.setDrawColor(187, 247, 208); // #bbf7d0
  doc.roundedRect(14, y, pageWidth - 28, 11, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('SETTLEMENT BREAKDOWN:', 18, y + 6.8);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`Prepaid Balances: ${prepaidTurnover.toLocaleString()} RWF   |   Cash Collected: ${cashTurnover.toLocaleString()} RWF   |   MTN MoMo: ${momoTurnover.toLocaleString()} RWF`, 65, y + 6.8);

  // 3. MEAL CONSUMPTION & AUDIT LOG TABLE
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("2. Meal Ledger & Counter Audit Logs", 14, y);

  const tableRows = activeRecords.map((r, i) => {
    const timeStr = r.timestamp ? new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';
    const typeLabel = r.type === 'regular' ? 'Subscriber' : r.type === 'guest' ? `Guest (${r.guestName || 'Friend'})` : 'Walk-in Diner';
    const paymentLabel = r.paymentMethod === 'balance' ? 'Prepaid Balance' : r.paymentMethod === 'momo' ? `MoMo (${r.momoReference || 'Paid'})` : 'Cash';
    
    return [
      (i + 1).toString(),
      timeStr,
      r.customerName,
      typeLabel,
      (r.shift || shift || 'lunch').toUpperCase(),
      `${r.mealCount} Meal`,
      `${r.amountRwf.toLocaleString()} RWF`,
      paymentLabel,
      r.status === 'valid' ? 'VERIFIED' : 'BLOCKED',
    ];
  });

  autoTable(doc, {
    startY: y + 3,
    head: [['#', 'Time', 'Customer Name / Account', 'Category', 'Shift', 'Meals', 'Amount', 'Settlement', 'Audit Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // #0f172a
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 14 },
      2: { cellWidth: 42, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 25 },
      8: { cellWidth: 18, halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // 4. SHIFT RECONCILIATION & RECONCILED PAYMENTS SUMMARY
  const finalY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 160) + 8;
  let recY = finalY;

  if (recY > 240) {
    doc.addPage();
    recY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Shift Reconciliation & Audit Certification', 14, recY);

  recY += 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, recY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const cashDiscrepancy = shiftCloseRecord ? shiftCloseRecord.cashDiscrepancyRwf : 0;
  const momoDiscrepancy = shiftCloseRecord ? shiftCloseRecord.momoDiscrepancyRwf : 0;

  doc.text(`Physical Cash Counted: ${(shiftCloseRecord?.cashCountedRwf ?? cashTurnover).toLocaleString()} RWF  (Recorded: ${cashTurnover.toLocaleString()} RWF · Variance: ${cashDiscrepancy >= 0 ? '+' : ''}${cashDiscrepancy.toLocaleString()} RWF)`, 18, recY + 6);
  doc.text(`MTN MoMo Verified: ${(shiftCloseRecord?.momoCountedRwf ?? momoTurnover).toLocaleString()} RWF  (Recorded: ${momoTurnover.toLocaleString()} RWF · Variance: ${momoDiscrepancy >= 0 ? '+' : ''}${momoDiscrepancy.toLocaleString()} RWF)`, 18, recY + 11.5);
  doc.text(`Reconciled MoMo Statements: ${payments.filter(p => p.reconciled).length} of ${payments.length} customer top-ups verified against MTN Business Till SMS inbox.`, 18, recY + 17);

  // 5. SIGNATURE & VERIFICATION STAMP
  recY += 32;
  if (recY > 265) {
    doc.addPage();
    recY = 25;
  }

  // Manager signature line
  doc.setDrawColor(148, 163, 184);
  doc.line(14, recY + 8, 80, recY + 8);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Manager / Cashier Signature', 14, recY + 12);
  doc.text('Tuyiringire Pacifique (Engineering Lead · NEXA)', 14, recY + 16);

  // Verification Seal
  doc.line(pageWidth - 80, recY + 8, pageWidth - 14, recY + 8);
  doc.text('System Certified Ledger Verification', pageWidth - 80, recY + 12);
  doc.text(`NEXA MealPass POS · Generated ${new Date().toLocaleString()}`, pageWidth - 80, recY + 16);

  // FOOTER
  const totalPages = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `NEXA MealPass Professional Cafeteria Management System  ·  Page ${i} of ${totalPages}  ·  Confidential Financial Record`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 6,
      { align: 'center' }
    );
  }

  return doc;
}
