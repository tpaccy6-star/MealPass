/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Store,
  User,
  ShieldCheck,
  ArrowRight,
  Lock,
  Smartphone,
  Sun,
  Moon,
  Sparkles
} from 'lucide-react';
import { useMealApp } from '../../context/MealAppContext';
import { sound } from '../../utils/audio';

interface AppLoginGateProps {
  onSelectCustomer: () => void;
  onSelectOwner: () => void;
}

export const AppLoginGate: React.FC<AppLoginGateProps> = ({
  onSelectCustomer,
  onSelectOwner,
}) => {
  const { settings, theme, toggleTheme, customers } = useMealApp();
  const isDark = theme === 'dark';

  const [portalMode, setPortalMode] = useState<'welcome' | 'owner_login'>('welcome');
  const [ownerPin, setOwnerPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Owner/Staff PIN is 1234 or any 4+ digit PIN
    if (ownerPin === '1234' || ownerPin === '0000' || ownerPin.length >= 4) {
      sound.playSuccess();
      onSelectOwner();
    } else {
      sound.playError();
      setPinError('Invalid PIN code. Use default PIN 1234 to login.');
    }
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 transition-colors duration-200 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-emerald-600/30">
            N
          </div>
          <div>
            <div className={`font-bold tracking-tight text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {settings.restaurantName}
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              NEXA MealPass System
            </div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border text-xs transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-xs'
          }`}
          title="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4 text-emerald-400" /> : <Moon className="w-4 h-4 text-emerald-600" />}
        </button>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-auto py-8">
        {portalMode === 'welcome' ? (
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800/80 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-slate-200/50'
          }`}>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                <span>Prepaid Dining & QR MealPass</span>
              </div>
              <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Welcome to {settings.restaurantName}
              </h1>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Enjoy fast buffet dining, daily dynamic QR meal passes, and flexible prepaid meals.
              </p>
            </div>

            {/* Action Selection */}
            <div className="space-y-3 pt-2">
              {/* Customer Access */}
              <button
                onClick={() => {
                  sound.playTap();
                  onSelectCustomer();
                }}
                className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-between group shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Customer / Diner</div>
                    <div className="text-xs text-emerald-100/80 font-normal">
                      Login or Register to view your QR MealPass
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Owner / Staff POS Access */}
              <button
                onClick={() => {
                  sound.playTap();
                  setPortalMode('owner_login');
                }}
                className={`w-full p-4 rounded-2xl border flex items-center justify-between group transition-all active:scale-[0.98] ${
                  isDark
                    ? 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-white'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3.5 text-left">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-slate-700/80 text-emerald-400' : 'bg-white text-emerald-600 border border-slate-200'
                  }`}>
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-sm">Restaurant Staff / POS</div>
                    <div className="text-xs text-slate-400 font-normal">
                      Scanner, Walk-ins, Balances & Reports
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Registered Customer Quick Badge */}
            <div className="text-center pt-2">
              <span className="text-[11px] text-slate-400">
                Active diners enrolled: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{customers.length} subscribers</strong>
              </span>
            </div>
          </div>
        ) : (
          /* Owner / Staff PIN Gate */
          <div className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-5 transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800/80 backdrop-blur-xl' : 'bg-white border-slate-200/80 shadow-slate-200/50'
          }`}>
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  sound.playTap();
                  setPortalMode('welcome');
                  setPinError('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium"
              >
                ← Back
              </button>
              <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold font-mono uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Authorized Staff Only</span>
              </div>
            </div>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto mb-2">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Restaurant POS Access
              </h2>
              <p className="text-xs text-slate-400">
                Enter your staff terminal PIN code (Default: 1234)
              </p>
            </div>

            <form onSubmit={handleOwnerLogin} className="space-y-4 pt-1">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="Enter 4-digit PIN (1234)"
                  value={ownerPin}
                  onChange={(e) => {
                    setOwnerPin(e.target.value);
                    setPinError('');
                  }}
                  className={`w-full px-4 py-3 rounded-2xl text-center text-xl font-mono tracking-widest font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                {pinError && (
                  <p className="text-xs text-rose-500 text-center font-medium mt-1.5 animate-in fade-in">
                    {pinError}
                  </p>
                )}
              </div>

              {/* Quick Number Pad */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map(btn => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      if (btn === 'C') {
                        setOwnerPin('');
                      } else if (btn === '✓') {
                        if (ownerPin === '1234' || ownerPin === '0000' || ownerPin.length >= 4) {
                          sound.playSuccess();
                          onSelectOwner();
                        } else {
                          sound.playError();
                          setPinError('Invalid PIN code. Use default PIN 1234.');
                        }
                      } else {
                        if (ownerPin.length < 6) {
                          setOwnerPin(prev => prev + btn);
                        }
                      }
                    }}
                    className={`py-3 rounded-xl font-mono font-bold text-base transition-colors ${
                      btn === '✓'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : btn === 'C'
                        ? isDark ? 'bg-slate-800 text-rose-400' : 'bg-slate-100 text-rose-600'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                    }`}
                  >
                    {btn}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-transform active:scale-[0.98]"
              >
                Access Terminal
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer / Location */}
      <div className="w-full max-w-md mx-auto text-center pb-2">
        <div className="text-[11px] text-slate-400">
          <span>{settings.location}</span>
          <span> · </span>
          <span>Meal Rate: {settings.mealPriceRwf.toLocaleString()} RWF</span>
        </div>
      </div>
    </div>
  );
};
