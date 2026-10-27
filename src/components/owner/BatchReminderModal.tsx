/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  MessageSquare, 
  Smartphone, 
  Copy, 
  Check, 
  Users, 
  CheckCircle2, 
  Send 
} from 'lucide-react';
import { Customer, RestaurantSettings } from '../../types';
import { sound } from '../../utils/audio';

interface BatchReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  settings: RestaurantSettings;
  isDark: boolean;
  todayDateStr: string;
}

export const BatchReminderModal: React.FC<BatchReminderModalProps> = ({
  isOpen,
  onClose,
  customers,
  settings,
  isDark,
  todayDateStr,
}) => {
  const [lang, setLang] = useState<'en' | 'rw'>('en');
  const [sentCustomerIds, setSentCustomerIds] = useState<string[]>([]);
  const [bulkCopied, setBulkCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter customers with <= lowBalanceThreshold (default 5 meals)
  const lowBalanceCustomers = customers.filter(
    c => c.mealsRemaining <= settings.lowBalanceThreshold
  );

  const generateMessage = (c: Customer, messageLang: 'en' | 'rw') => {
    const replenishMeals = 10;
    const replenishRwf = replenishMeals * settings.mealPriceRwf;
    if (messageLang === 'rw') {
      return `Muraho ${c.name}, ifatabuguzi ryanyu ryo kurya muri ${settings.restaurantName} risigaranye amafunguro ${c.mealsRemaining}. Komeza urye neza wishyura kuri MTN Mobile Money (*182*8*1*${settings.momoMerchantCode}#) amafaranga ${replenishRwf.toLocaleString()} RWF (amafunguro 10). Murakoze!`;
    }
    return `Hello ${c.name}, your ${settings.restaurantName} meal pass has only ${c.mealsRemaining} meals remaining. To avoid cafeteria lunch queues, please replenish your balance (${replenishMeals} meals = ${replenishRwf.toLocaleString()} RWF) via MTN Mobile Money (*182*8*1*${settings.momoMerchantCode}#). Thank you!`;
  };

  const handleCopySingle = (c: Customer) => {
    sound.playTap();
    const msg = generateMessage(c, lang);
    navigator.clipboard?.writeText(msg);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (c: Customer) => {
    sound.playTap();
    setSentCustomerIds(prev => (prev.includes(c.id) ? prev : [...prev, c.id]));
    const cleanPhone = c.phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('250') ? cleanPhone : `250${cleanPhone.slice(-9)}`;
    const msg = generateMessage(c, lang);
    navigator.clipboard?.writeText(msg);
    if (typeof window !== 'undefined') {
      const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
    }
  };

  const handleCopyAllBulk = () => {
    sound.playTap();
    const listText = lowBalanceCustomers.map((c, i) => {
      const msg = generateMessage(c, lang);
      return `${i + 1}. ${c.name} (${c.phone} - ${c.mealsRemaining} meals left):\n${msg}`;
    }).join('\n\n');

    const fullBroadcast = `*${settings.restaurantName.toUpperCase()} - BULK MEAL BALANCE RENEWAL NOTICE*\nDate: ${todayDateStr} | MoMo Pay: *182*8*1*${settings.momoMerchantCode}#\n\n${listText}`;

    navigator.clipboard?.writeText(fullBroadcast);
    setBulkCopied(true);
    setTimeout(() => setBulkCopied(false), 2500);
  };

  const handleMarkAllNotified = () => {
    sound.playTap();
    setSentCustomerIds(lowBalanceCustomers.map(c => c.id));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className={`w-full max-w-lg rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                <span>Batch Remind Low-Balance Customers</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-500 font-mono text-[10px]">
                  {lowBalanceCustomers.length} Total
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Notify everyone with ≤ {settings.lowBalanceThreshold} meals remaining in one batch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xs p-1"
          >
            ✕
          </button>
        </div>

        {/* Controls Bar: Language & Progress */}
        <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Template:</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  lang === 'en' ? 'bg-emerald-600 text-white shadow-xs' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('rw')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                  lang === 'rw' ? 'bg-emerald-600 text-white shadow-xs' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-white border border-slate-300 text-slate-700'
                }`}
              >
                Kinyarwanda
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-500 font-semibold">
              {sentCustomerIds.length} of {lowBalanceCustomers.length} Contacted
            </span>
            {sentCustomerIds.length < lowBalanceCustomers.length && (
              <button
                onClick={handleMarkAllNotified}
                className="text-[10px] text-slate-400 hover:text-emerald-500 underline"
              >
                Mark all sent
              </button>
            )}
          </div>
        </div>

        {/* Bulk Action Strip */}
        <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 text-xs shrink-0 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="text-[11px] text-slate-400">
            MTN MoMo Till: <strong className="font-mono text-emerald-500">*182*8*1*{settings.momoMerchantCode}#</strong>
          </div>
          <button
            onClick={handleCopyAllBulk}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            {bulkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{bulkCopied ? 'Broadcast List Copied!' : 'Copy All for WhatsApp Broadcast'}</span>
          </button>
        </div>

        {/* Scrollable Customer Reminder Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {lowBalanceCustomers.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <span>Great news! All registered customers currently have healthy balances (&gt; {settings.lowBalanceThreshold} meals).</span>
            </div>
          ) : (
            lowBalanceCustomers.map(cust => {
              const isSent = sentCustomerIds.includes(cust.id);
              const messageText = generateMessage(cust, lang);

              return (
                <div
                  key={cust.id}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-white border-slate-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {cust.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={`font-semibold text-xs flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span>{cust.name}</span>
                          <span className={`text-[10px] font-mono font-bold ${
                            cust.mealsRemaining === 0 ? 'text-slate-400' : 'text-emerald-500'
                          }`}>
                            ({cust.mealsRemaining === 0 ? '0 Meals - Finished' : `${cust.mealsRemaining} meals left`})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {cust.phone} · {cust.category}
                        </div>
                      </div>
                    </div>

                    {isSent ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-500 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Notified</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 text-[10px] font-medium shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Formatted Message Preview */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed select-text">
                    {messageText}
                  </div>

                  {/* Customer Card Action Buttons */}
                  <div className="flex items-center justify-end gap-2 mt-2.5">
                    <button
                      onClick={() => handleCopySingle(cust)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1 transition-colors ${
                        copiedId === cust.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                    >
                      {copiedId === cust.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === cust.id ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(cust)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-3 border-t flex items-center justify-between text-xs shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
        }`}>
          <span className="text-[11px] text-slate-400">
            {lowBalanceCustomers.length} customers eligible for renewal reminder
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold ${
              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
            }`}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
