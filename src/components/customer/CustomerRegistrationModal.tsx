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
  const [customAmountInput, setCustomAmountInput] = useState<string>('35000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const numericDeposit = Math.max(0, Number(customAmountInput) || 0);
  const calculatedMeals = Math.floor(numericDeposit / mealPriceRwf);
  const planFullPrice = category === 'Student' ? 35000 : category === 'Worker' ? 45000 : 40000;
  const isPartial = numericDeposit > 0 && numericDeposit < planFullPrice;
  const planBalanceRemaining = Math.max(0, planFullPrice - numericDeposit);

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
      const newCustomer = await onRegister(name.trim(), phone.trim(), numericDeposit, category);
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

          {/* Starter Meal Package Plan & Flexible Payment */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400">
                Prepaid Plan & Flexible Payment
              </label>
              <span className="text-[10px] text-emerald-500 font-mono font-bold">
                {calculatedMeals} Meals Credited
              </span>
            </div>

            {/* Plan Preset Cards */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setSelectedDeposit(35000);
                  setCustomAmountInput('35000');
                  setCategory('Student');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  category === 'Student'
                    ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500'
                    : isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-500">Student Plan</span>
                  <span className="text-[9px] font-mono text-slate-400">35k FRW Target</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Student Rate
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setSelectedDeposit(45000);
                  setCustomAmountInput('45000');
                  setCategory('Worker');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  category === 'Worker'
                    ? 'border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500'
                    : isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold uppercase text-emerald-500">Worker Plan</span>
                  <span className="text-[9px] font-mono text-slate-400">45k FRW Target</span>
                </div>
                <div className={`text-xs font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Worker Rate
                </div>
              </button>
            </div>

            {/* Flexible Custom Amount Input */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Amount Paid Today (Full or Partial RWF):</span>
                <span className="font-mono text-emerald-500 font-bold">
                  @ {mealPriceRwf.toLocaleString()} RWF / meal
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step={500}
                  min={0}
                  value={customAmountInput}
                  onChange={(e) => {
                    setCustomAmountInput(e.target.value);
                    setSelectedDeposit(Number(e.target.value) || 0);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Enter any amount (e.g. 10000, 20000, 35000)"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-emerald-500 font-bold">
                  = {calculatedMeals} Meals
                </span>
              </div>
            </div>

            {/* Partial Payment Notice / Breakdown */}
            {isPartial && (
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-[10px] text-slate-300 flex justify-between items-center">
                <span>Partial payment accepted:</span>
                <span className="font-mono text-amber-400">
                  Plan balance: {planBalanceRemaining.toLocaleString()} RWF remaining
                </span>
              </div>
            )}

            {numericDeposit === 0 && (
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-[10px] text-slate-400">
                Opening account with 0 RWF. You can top-up at any time before your first cafeteria meal scan.
              </div>
            )}

            {/* Quick partial / custom chips */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                { label: '5k FRW (2 Meals)', val: 5000 },
                { label: '10k FRW (5 Meals)', val: 10000 },
                { label: '20k FRW (10 Meals)', val: 20000 },
                { label: '35k FRW (Full Student)', val: 35000 },
                { label: '45k FRW (Full Worker)', val: 45000 },
              ].map(chip => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setSelectedDeposit(chip.val);
                    setCustomAmountInput(String(chip.val));
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                    numericDeposit === chip.val
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
