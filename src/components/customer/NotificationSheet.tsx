/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, ShieldCheck, AlertTriangle, Clock, Utensils, X } from 'lucide-react';
import { Customer, RestaurantSettings } from '../../types';

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  settings: RestaurantSettings;
  isDark: boolean;
}

export const NotificationSheet: React.FC<NotificationSheetProps> = ({
  isOpen,
  onClose,
  customer,
  settings,
  isDark,
}) => {
  if (!isOpen) return null;

  const isLow = customer.mealsRemaining <= settings.lowBalanceThreshold;
  const isExhausted = customer.mealsRemaining === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-150">
      <div
        className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-3.5 transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-700 text-white'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">Notifications & Updates</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Balance Alert Notification */}
          <div
            className={`p-3 rounded-2xl border text-xs space-y-1 ${
              isExhausted
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : isLow
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : isDark
                ? 'bg-slate-800/80 border-slate-700/80'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {isLow || isExhausted ? (
                <AlertTriangle className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>Prepaid Meal Status</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {isExhausted
                ? 'Your meal pass has run out (0 meals). Top up via MoMo *182*8*1*TILL# to resume dining.'
                : isLow
                ? `Only ${customer.mealsRemaining} meals remaining on your ${customer.category} plan. Remember to replenish soon.`
                : `You currently have ${customer.mealsRemaining} meals remaining with full buffet access.`}
            </p>
          </div>

          {/* Dining Schedule Notice */}
          <div
            className={`p-3 rounded-2xl border text-xs space-y-1 ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Cafeteria Dining Hours</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Lunch Shift: 12:00 – 15:00 · Dinner Shift: 18:00 – 21:00 at {settings.restaurantName} ({settings.location}).
            </p>
          </div>

          {/* Fresh Buffet Quality Notice */}
          <div
            className={`p-3 rounded-2xl border text-xs space-y-1 ${
              isDark ? 'bg-slate-800/80 border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
              <span>Fresh Daily Buffet Service</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Subscribers enjoy complete self-serve hot entrees, steamed rice, beans, fresh greens, and seasonal fruits with every meal scan.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
        >
          Got it
        </button>
      </div>
    </div>
  );
};
