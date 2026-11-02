/**
 * Customer Self-Registration & Onboarding Modal
 * Allows new customers to register their account directly, choose a meal plan, and start using the app immediately.
 */

import React, { useState } from 'react';
import { UserPlus, Sparkles, Smartphone, Check, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { Customer } from '../../types';
import { sound } from '../../utils/audio';

interface CustomerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  mealPriceRwf: number;
  momoMerchantCode: string;
  onRegister: (
    name: string,
    phone: string,
    initialDepositRwf: number,
    category: Customer['category']
  ) => Promise<Customer>;
  onSuccess: (newCustomer: Customer) => void;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  isOpen,
  onClose,
  isDark,
  mealPriceRwf,
  momoMerchantCode,
  onRegister,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<Customer['category']>('Student');
  const [selectedDeposit, setSelectedDeposit] = useState<number>(35000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const calculatedMeals = Math.floor(selectedDeposit / mealPriceRwf);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Please enter your full name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    sound.playTap();

    try {
      const newCustomer = await onRegister(name.trim(), phone.trim(), selectedDeposit, category);
      sound.playSuccess();
      onSuccess(newCustomer);
      onClose();
    } catch (err: any) {
      sound.playError();
      setErrorMsg(err.message || 'Registration failed. Please check your network or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl max-h-[92vh] overflow-y-auto space-y-3.5 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Register New Meal Pass</h3>
              <p className="text-[10px] text-slate-400">Join Kigali Garden Bistro prepaid meal club</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
          >
            ✕
          </button>
        </div>

        {/* Benefits badge */}
        <div className={`p-2.5 rounded-2xl border text-xs flex items-center gap-2 ${
          isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-[11px] leading-tight">
            Instant daily QR generation, cafeteria queue skip, and guest meal sharing.
          </span>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl border border-red-500/40 bg-red-500/15 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Your Full Name
            </label>
            <input
              type="text"
              placeholder="e.g. Divine Mutoni"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              MTN MoMo / WhatsApp Phone (Rwanda)
            </label>
            <input
              type="text"
              placeholder="e.g. 0788 123 456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Customer Category */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Dining Category
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['Student', 'Worker', 'Regular'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setCategory(cat);
                    if (cat === 'Student') setSelectedDeposit(35000);
                    else if (cat === 'Worker') setSelectedDeposit(45000);
                    else setSelectedDeposit(40000);
                  }}
                  className={`py-1.5 px-2 rounded-xl font-semibold border transition-all ${
                    category === cat
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-400'
                      : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Starter Meal Package Plan */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-400">
                Choose Starter Prepaid Plan
              </label>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">
                {calculatedMeals} Meals Credited
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setSelectedDeposit(35000);
                  setCategory('Student');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                  selectedDeposit === 35000
                    ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500'
                    : isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-500">Student Plan</span>
                  <span className="text-[9px] font-mono text-slate-400">17 Meals</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  35,000 FRW
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setSelectedDeposit(45000);
                  setCategory('Worker');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                  selectedDeposit === 45000
                    ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500'
                    : isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-500">Worker Plan</span>
                  <span className="text-[9px] font-mono text-slate-400">22 Meals</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  45,000 FRW
                </div>
              </button>
            </div>

            {/* Additional deposit chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '20k FRW (10 Meals)', val: 20000 },
                { label: '40k FRW (20 Meals)', val: 40000 },
                { label: '60k FRW (30 Meals)', val: 60000 },
              ].map(chip => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setSelectedDeposit(chip.val);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                    selectedDeposit === chip.val
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Prompt Info */}
          <div className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>MTN Mobile Money Settlement</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Account will be immediately provisioned. Pay via Till: <strong className="text-white font-mono">*182*8*1*{momoMerchantCode}#</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-2 rounded-xl text-xs font-medium ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !phone.trim()}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating Pass...</span>
                </>
              ) : (
                <>
                  <span>Activate & Start Dining</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
