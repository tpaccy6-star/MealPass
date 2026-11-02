/**
 * First-Time Customer Onboarding & Registration Gate
 * Displayed when a user opens the Customer App before they register or sign in with their phone number.
 */

import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Sparkles,
  Smartphone,
  UserCheck,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  LogIn
} from 'lucide-react';
import { Customer, RestaurantSettings } from '../../types';
import { sound } from '../../utils/audio';

interface CustomerOnboardingGateProps {
  isDark: boolean;
  settings: RestaurantSettings;
  customers: Customer[];
  onRegister: (
    name: string,
    phone: string,
    initialDepositRwf: number,
    category: Customer['category']
  ) => Promise<Customer>;
  onSelectCustomer: (customer: Customer) => void;
}

export const CustomerOnboardingGate: React.FC<CustomerOnboardingGateProps> = ({
  isDark,
  settings,
  customers,
  onRegister,
  onSelectCustomer,
}) => {
  const [mode, setMode] = useState<'register' | 'signin'>('register');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<Customer['category']>('Student');
  const [customAmountInput, setCustomAmountInput] = useState<string>('35000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign in by phone
  const [signinPhone, setSigninPhone] = useState('');

  const numericDeposit = Math.max(0, Number(customAmountInput) || 0);
  const calculatedMeals = Math.floor(numericDeposit / settings.mealPriceRwf);
  const planFullPrice = category === 'Student' ? 35000 : category === 'Worker' ? 45000 : 40000;
  const isPartial = numericDeposit > 0 && numericDeposit < planFullPrice;

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Please enter your full name and phone number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    sound.playTap();

    try {
      const newCust = await onRegister(name.trim(), phone.trim(), numericDeposit, category);
      sound.playSuccess();
      onSelectCustomer(newCust);
    } catch (err: any) {
      sound.playError();
      setErrorMsg(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSigninSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playTap();
    const cleanSearch = signinPhone.replace(/[^0-9]/g, '');
    const found = customers.find(c => c.phone.replace(/[^0-9]/g, '').includes(cleanSearch));

    if (found) {
      sound.playSuccess();
      onSelectCustomer(found);
    } else {
      sound.playError();
      setErrorMsg(`No registered account found matching "${signinPhone}". Please register below.`);
    }
  };

  return (
    <div className={`flex-1 flex flex-col justify-center items-center p-4 sm:p-6 ${
      isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
      }`}>

        {/* Brand & Restaurant Intro */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto font-black shadow-lg shadow-emerald-600/30">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {settings.restaurantName}
          </h2>
          <p className="text-xs text-slate-400">
            Prepaid MealPass & Daily QR Dining App
          </p>
        </div>

        {/* Mode Switcher Tabs: Register vs Sign In */}
        <div className={`p-1 rounded-xl border flex text-xs font-semibold ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setMode('register');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            New Customer (Register)
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Already Registered
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl border border-red-500/40 bg-red-500/15 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {/* MODE 1: REGISTRATION */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[11px]">
                Register to receive your unique daily dining QR codes & meal allowance.
              </span>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Divine Mutoni"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Phone Number (WhatsApp / MoMo)
              </label>
              <input
                type="text"
                placeholder="e.g. 0789 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

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
                      if (cat === 'Student') setCustomAmountInput('35000');
                      else if (cat === 'Worker') setCustomAmountInput('45000');
                      else setCustomAmountInput('40000');
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

            {/* Flexible Payment Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">
                  Prepaid Amount (Full or Flexible Partial)
                </label>
                <span className="text-[10px] text-emerald-500 font-mono font-bold">
                  {calculatedMeals} Meals Credited
                </span>
              </div>

              <div className="relative mb-1.5">
                <input
                  type="number"
                  step={500}
                  min={0}
                  value={customAmountInput}
                  onChange={(e) => setCustomAmountInput(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Enter custom deposit (e.g. 10000, 20000)"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-emerald-500 font-bold">
                  = {calculatedMeals} Meals
                </span>
              </div>

              {isPartial && (
                <div className="text-[10px] text-amber-400 font-mono">
                  ● Partial payment allowed: {calculatedMeals} meals credited now; top-up anytime.
                </div>
              )}

              {/* Quick preset chips */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[
                  { label: '0 FRW', val: '0' },
                  { label: '10k FRW', val: '10000' },
                  { label: '20k FRW', val: '20000' },
                  { label: '35k FRW', val: '35000' },
                  { label: '45k FRW', val: '45000' },
                ].map(chip => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setCustomAmountInput(chip.val);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded-lg border transition-colors ${
                      customAmountInput === chip.val
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                        : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !phone.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Register & Open My MealPass</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        )}

        {/* MODE 2: SIGN IN / PHONE LOOKUP */}
        {mode === 'signin' && (
          <form onSubmit={handleSigninSubmit} className="space-y-3">
            <p className="text-xs text-slate-400">
              Enter the phone number you registered with to load your meal pass and QR code.
            </p>

            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Registered Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 0781 343 621"
                value={signinPhone}
                onChange={(e) => setSigninPhone(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={!signinPhone.trim()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Access My Account</span>
            </button>

            {/* Quick Demo Customer Buttons */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[10px] text-slate-400 block">Or select existing registered diner:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {customers.slice(0, 4).map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      onSelectCustomer(c);
                    }}
                    className={`p-2 rounded-xl border text-left text-[11px] truncate ${
                      isDark ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="font-bold truncate">{c.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-slate-400">{c.mealsRemaining} meals</div>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
