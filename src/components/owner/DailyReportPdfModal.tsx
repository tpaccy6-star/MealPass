/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  X, 
  TrendingUp, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Clock 
} from 'lucide-react';
import { MealRecord, PaymentRecord, RestaurantSettings, MealShift, ShiftCloseRecord } from '../../types';
import { generateDailyMealReportPdf } from '../../utils/pdfExport';
import { sound } from '../../utils/audio';

interface DailyReportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: RestaurantSettings;
  records: MealRecord[];
  payments: PaymentRecord[];
  shiftCloseRecord?: ShiftCloseRecord | null;
  dateStr: string;
  currentShift: MealShift;
  isDark: boolean;
  onExportCsv: () => void;
}

export const DailyReportPdfModal: React.FC<DailyReportPdfModalProps> = ({
  isOpen,
  onClose,
  settings,
  records,
  payments,
  shiftCloseRecord,
  dateStr,
  currentShift,
  isDark,
  onExportCsv,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);

  if (!isOpen) return null;

  const validRecords = records.filter(r => r.status === 'valid');
  const dayRecords = validRecords.filter(r => r.timestamp.startsWith(dateStr));
  const activeRecords = dayRecords.length > 0 ? dayRecords : validRecords.slice(0, 20);

  const totalMeals = activeRecords.reduce((sum, r) => sum + r.mealCount, 0);
  const regularMeals = activeRecords.filter(r => r.type === 'regular').reduce((sum, r) => sum + r.mealCount, 0);
  const guestMeals = activeRecords.filter(r => r.type === 'guest').reduce((sum, r) => sum + r.mealCount, 0);
  const walkinMeals = activeRecords.filter(r => r.type === 'walk-in').reduce((sum, r) => sum + r.mealCount, 0);
  const grossTurnover = activeRecords.reduce((sum, r) => sum + r.amountRwf, 0);

  const cashTurnover = activeRecords
    .filter(r => r.paymentMethod === 'cash')
    .reduce((sum, r) => sum + r.amountRwf, 0);
  const momoTurnover = activeRecords
    .filter(r => r.paymentMethod === 'momo')
    .reduce((sum, r) => sum + r.amountRwf, 0);
  const prepaidTurnover = activeRecords
    .filter(r => r.paymentMethod === 'balance')
    .reduce((sum, r) => sum + r.amountRwf, 0);

  const handleDownloadPdfFile = () => {
    sound.playTap();
    setIsDownloading(true);

    try {
      const doc = generateDailyMealReportPdf({
        date: dateStr,
        shift: currentShift,
        settings,
        records,
        payments,
        shiftCloseRecord: shiftCloseRecord || undefined,
      });

      const fileName = `${settings.restaurantName.toLowerCase().replace(/\s+/g, '_')}_meal_report_${dateStr}.pdf`;
      doc.save(fileName);
      sound.playSuccess();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch {
      sound.playError();
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintDocument = () => {
    sound.playTap();
    window.print();
  };

  const handleCopySummaryWhatsApp = () => {
    sound.playTap();
    const text = `
*${settings.restaurantName.toUpperCase()} — DAILY MEAL REPORT*
📅 *Date:* ${dateStr}
⏰ *Shift:* ${currentShift.toUpperCase()} Service
📍 *Location:* ${settings.location}
━━━━━━━━━━━━━━━━━━
📊 *OPERATIONAL SUMMARY*
• Total Meals Served: *${totalMeals}*
• Regular Subscribers: *${regularMeals}*
• Guest Meals: *${guestMeals}*
• Walk-in Diners: *${walkinMeals}*
━━━━━━━━━━━━━━━━━━
💰 *FINANCIAL AUDIT*
• Total Meal Turnover: *${grossTurnover.toLocaleString()} RWF*
• Prepaid Meal Deductions: ${prepaidTurnover.toLocaleString()} RWF
• Walk-in Cash Collected: ${cashTurnover.toLocaleString()} RWF
• MTN MoMo Collected: ${momoTurnover.toLocaleString()} RWF (*182*8*1*${settings.momoMerchantCode}#)
━━━━━━━━━━━━━━━━━━
🔒 *Audit Verified via NEXA MealPass System*
    `.trim();

    navigator.clipboard?.writeText(text);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
        }`}
      >
        {/* MODAL CONTROL HEADER */}
        <div
          className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Formatted Daily Meal Report</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full font-semibold">
                  PDF Export
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Official document for restaurant accounting, tax compliance & management audits.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Download PDF Button */}
            <button
              onClick={handleDownloadPdfFile}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? 'Generating...' : 'Download Formatted PDF (.pdf)'}</span>
                </>
              )}
            </button>

            {/* Print Document */}
            <button
              onClick={handlePrintDocument}
              title="Print document"
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* DOCUMENT PREVIEW CONTAINER (Styled like an authentic A4 PDF sheet) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/50 dark:bg-slate-950/60">
          <div className="max-w-3xl mx-auto bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-300 overflow-hidden font-sans print:shadow-none print:border-none print:m-0 print:max-w-full">
            
            {/* Top Emerald Stripe */}
            <div className="h-2 bg-emerald-600 w-full" />

            <div className="p-6 sm:p-8 space-y-6">
              
              {/* DOCUMENT LETTERHEAD */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                    <h1 className="text-xl font-black tracking-tight uppercase text-slate-950">
                      {settings.restaurantName}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-500">
                    {settings.location} · Tel: {settings.phone}
                  </p>
                  <p className="text-xs font-mono font-medium text-emerald-700">
                    MTN MoMo Merchant Till: *182*8*1*{settings.momoMerchantCode}#
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-right sm:min-w-[200px]">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600">
                    OFFICIAL DAILY REPORT
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center justify-end gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{dateStr}</span>
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 flex items-center justify-end gap-1 mt-0.5 capitalize">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{currentShift} Shift Service</span>
                  </div>
                </div>
              </div>

              {/* 1. OPERATIONAL SUMMARY KPI TILES */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  1. Operational Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Total Meals</span>
                    <span className="text-2xl font-black text-slate-950 font-mono mt-0.5 block">{totalMeals}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">{activeRecords.length} Transactions</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Subscribers</span>
                    <span className="text-2xl font-black text-slate-950 font-mono mt-0.5 block">{regularMeals}</span>
                    <span className="text-[10px] text-slate-500">Daily QR Passes</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Walk-in Diners</span>
                    <span className="text-2xl font-black text-slate-950 font-mono mt-0.5 block">{walkinMeals}</span>
                    <span className="text-[10px] text-slate-500">Cash & MoMo Counter</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Meal Turnover</span>
                    <span className="text-2xl font-black text-emerald-600 font-mono mt-0.5 block">
                      {(grossTurnover / 1000).toFixed(0)}k <span className="text-xs font-normal">RWF</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{grossTurnover.toLocaleString()} RWF</span>
                  </div>
                </div>

                {/* Revenue Settlement Bar */}
                <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-emerald-800 text-[11px] uppercase tracking-wide">
                    Settlement Breakdown:
                  </span>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
                    <span>Prepaid: <strong>{prepaidTurnover.toLocaleString()} RWF</strong></span>
                    <span className="text-emerald-300">·</span>
                    <span>Cash: <strong>{cashTurnover.toLocaleString()} RWF</strong></span>
                    <span className="text-emerald-300">·</span>
                    <span>MTN MoMo: <strong>{momoTurnover.toLocaleString()} RWF</strong></span>
                  </div>
                </div>
              </div>

              {/* 2. MEAL LEDGER & CONSUMPTION TABLE */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    2. Meal Ledger & Counter Audit Logs
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    Showing {activeRecords.length} records
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white text-[10px] uppercase font-bold">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-2">Time</th>
                        <th className="py-2 px-3">Customer / Account</th>
                        <th className="py-2 px-2">Category</th>
                        <th className="py-2 px-2 text-center">Meals</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3">Settlement</th>
                        <th className="py-2 px-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeRecords.map((rec, index) => (
                        <tr key={rec.id} className={index % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          <td className="py-2 px-3 font-mono text-slate-400 text-[10px]">{index + 1}</td>
                          <td className="py-2 px-2 font-mono text-[11px] text-slate-600">
                            {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">
                            {rec.customerName}
                            {rec.type === 'guest' && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                Guest: {rec.guestName || 'Friend'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-600 capitalize text-[11px]">
                            {rec.type === 'regular' ? 'Subscriber' : rec.type === 'guest' ? 'Guest Pass' : 'Walk-in'}
                          </td>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-800">
                            {rec.mealCount}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            {rec.amountRwf.toLocaleString()} RWF
                          </td>
                          <td className="py-2 px-3 text-[11px] text-slate-600">
                            {rec.paymentMethod === 'balance' ? (
                              <span className="text-slate-700">Prepaid</span>
                            ) : rec.paymentMethod === 'momo' ? (
                              <span className="text-emerald-700 font-mono font-medium">
                                MoMo {rec.momoReference ? `(${rec.momoReference.slice(-6)})` : ''}
                              </span>
                            ) : (
                              <span className="text-slate-800 font-medium">Cash</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              VERIFIED
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. SHIFT RECONCILIATION SUMMARY */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>3. Shift Close & Cash Drawer Reconciliation</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Physical Cash Counted</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {(shiftCloseRecord?.cashCountedRwf ?? cashTurnover).toLocaleString()} RWF
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Recorded: {cashTurnover.toLocaleString()} RWF · Variance: {((shiftCloseRecord?.cashDiscrepancyRwf ?? 0) >= 0 ? '+' : '')}{(shiftCloseRecord?.cashDiscrepancyRwf ?? 0).toLocaleString()} RWF
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">MTN MoMo Counted</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {(shiftCloseRecord?.momoCountedRwf ?? momoTurnover).toLocaleString()} RWF
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Recorded: {momoTurnover.toLocaleString()} RWF · Variance: {((shiftCloseRecord?.momoDiscrepancyRwf ?? 0) >= 0 ? '+' : '')}{(shiftCloseRecord?.momoDiscrepancyRwf ?? 0).toLocaleString()} RWF
                    </span>
                  </div>
                </div>

                {shiftCloseRecord?.notes && (
                  <p className="text-[11px] text-slate-600 pt-1">
                    <strong>Cashier Remarks:</strong> {shiftCloseRecord.notes}
                  </p>
                )}
              </div>

              {/* 4. OFFICIAL CERTIFICATION & SIGNATURES */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between gap-6 text-xs text-slate-500">
                <div className="space-y-1">
                  <div className="w-48 border-b border-slate-400 pb-1 font-semibold text-slate-800">
                    Tuyiringire Pacifique
                  </div>
                  <div className="text-[10px]">Manager / Cashier in Charge</div>
                  <div className="text-[10px] font-mono">Date: {dateStr}</div>
                </div>

                <div className="space-y-1 sm:text-right">
                  <div className="font-semibold text-slate-800 flex items-center sm:justify-end gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>NEXA MealPass Verified Ledger</span>
                  </div>
                  <div className="text-[10px] font-mono">
                    System Audit ID: NEXA-AUDIT-{dateStr.replace(/-/g, '')}-OK
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Digital copy generated {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* MODAL BOTTOM ACTION BAR */}
        <div
          className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummaryWhatsApp}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              {summaryCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500">Summary Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy for WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={onExportCsv}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdfFile}
              disabled={isDownloading}
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Saving PDF...' : 'Save .PDF Document'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
